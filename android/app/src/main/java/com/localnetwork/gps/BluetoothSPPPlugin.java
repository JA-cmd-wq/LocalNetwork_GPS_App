package com.localnetwork.gps;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothSPP",
    permissions = {
        @Permission(
            alias = "bluetoothLegacy",
            strings = {
                "android.permission.BLUETOOTH",
                "android.permission.BLUETOOTH_ADMIN",
                "android.permission.ACCESS_FINE_LOCATION"
            }
        ),
        @Permission(
            alias = "bluetoothModern",
            strings = {
                "android.permission.BLUETOOTH_CONNECT",
                "android.permission.BLUETOOTH_SCAN"
            }
        )
    }
)
public class BluetoothSPPPlugin extends Plugin {

    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private BluetoothSocket socket;
    private Thread readThread;
    private volatile boolean reading = false;

    @PluginMethod
    public void listPaired(PluginCall call) {
        if (!ensurePermissions(call, "onPermListPaired")) return;
        doListPaired(call);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null) {
            call.reject("address required");
            return;
        }

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Bluetooth not available");
            return;
        }

        BluetoothDevice device;
        try {
            device = adapter.getRemoteDevice(address);
        } catch (Exception e) {
            call.reject("Invalid address: " + address);
            return;
        }

        new Thread(() -> {
            try {
                adapter.cancelDiscovery();
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                socket.connect();
                startReading();
                call.resolve();
            } catch (SecurityException e) {
                call.reject("Permission denied: " + e.getMessage());
            } catch (Exception e) {
                call.reject("Connect failed: " + e.getMessage());
            }
        }).start();
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        closeConnection();
        call.resolve();
    }

    private void startReading() {
        reading = true;
        readThread = new Thread(() -> {
            try {
                InputStream in = socket.getInputStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(in, "UTF-8"));
                String line;
                while (reading && (line = reader.readLine()) != null) {
                    JSObject data = new JSObject();
                    data.put("line", line);
                    notifyListeners("sppData", data);
                }
            } catch (Exception e) {
                if (reading) {
                    reading = false;
                    JSObject err = new JSObject();
                    err.put("error", e.getMessage());
                    notifyListeners("sppDisconnected", err);
                }
            }
        });
        readThread.setDaemon(true);
        readThread.start();
    }

    private void closeConnection() {
        reading = false;
        try {
            if (readThread != null) {
                readThread.interrupt();
                readThread = null;
            }
        } catch (Exception ignored) {}
        try {
            if (socket != null) {
                socket.close();
                socket = null;
            }
        } catch (Exception ignored) {}
    }

    private boolean ensurePermissions(PluginCall call, String callbackName) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetoothModern") != PermissionState.GRANTED) {
                requestPermissionForAlias("bluetoothModern", call, callbackName);
                return false;
            }
        } else {
            if (getPermissionState("bluetoothLegacy") != PermissionState.GRANTED) {
                requestPermissionForAlias("bluetoothLegacy", call, callbackName);
                return false;
            }
        }
        return true;
    }

    @PermissionCallback
    private void onPermListPaired(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (getPermissionState("bluetoothModern") != PermissionState.GRANTED) {
                call.reject("Bluetooth permission denied");
                return;
            }
        }
        doListPaired(call);
    }

    private void doListPaired(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Bluetooth not available");
            return;
        }
        try {
            Set<BluetoothDevice> paired = adapter.getBondedDevices();
            JSArray devices = new JSArray();
            for (BluetoothDevice d : paired) {
                JSObject obj = new JSObject();
                obj.put("name", d.getName() != null ? d.getName() : "Unknown");
                obj.put("address", d.getAddress());
                devices.put(obj);
            }
            JSObject ret = new JSObject();
            ret.put("devices", devices);
            call.resolve(ret);
        } catch (SecurityException e) {
            call.reject("Bluetooth permission denied: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnDestroy() {
        closeConnection();
        super.handleOnDestroy();
    }
}
