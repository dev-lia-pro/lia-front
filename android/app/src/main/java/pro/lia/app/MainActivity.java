package pro.lia.app;

import android.os.Bundle;
import android.view.Window;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Rendre les barres système OPAQUES (couleur navy de votre thème)
        // Le reste sera géré par le CSS avec env(safe-area-inset-*)
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#0B1B2B"));
        window.setNavigationBarColor(Color.parseColor("#0B1B2B"));
    }
}
