package media.myve.portal;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Lifts the WebView above the keyboard.
     *
     * The app targets SDK 36, and from Android 15 on that means edge-to-edge is
     * enforced: the window is no longer resized for the keyboard, so the
     * keyboard simply drew over the bottom of the portal — the chat composer
     * included. Nothing on the web side can fix that, because the page never
     * learns the keyboard is there.
     *
     * So the WebView gets a bottom margin as tall as the keyboard. The page sees
     * a shorter viewport, `100dvh` shrinks with it and the composer lands right
     * above the keys. The status bar is left alone: the header already pads for
     * it through `env(safe-area-inset-top)`.
     *
     * The insets passed on to the WebView are edited to match. The keyboard is
     * taken out, or the page would react to it a second time; and while it is
     * up the navigation-bar inset is zeroed, because the keyboard covers the
     * navigation bar and the page would otherwise leave a gap above the keys.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, insets) -> {
            boolean keyboardUp = insets.isVisible(WindowInsetsCompat.Type.ime());
            int lift = keyboardUp ? insets.getInsets(WindowInsetsCompat.Type.ime()).bottom : 0;

            ViewGroup.MarginLayoutParams params = (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            if (params.bottomMargin != lift) {
                params.bottomMargin = lift;
                view.setLayoutParams(params);
            }

            WindowInsetsCompat.Builder forPage = new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.ime(), Insets.NONE);
            if (keyboardUp) {
                Insets nav = insets.getInsets(WindowInsetsCompat.Type.navigationBars());
                forPage.setInsets(WindowInsetsCompat.Type.navigationBars(), Insets.of(nav.left, nav.top, nav.right, 0));
            }
            return ViewCompat.onApplyWindowInsets(view, forPage.build());
        });
    }
}
