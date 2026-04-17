package com.localnetwork.gps;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothSPPPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
