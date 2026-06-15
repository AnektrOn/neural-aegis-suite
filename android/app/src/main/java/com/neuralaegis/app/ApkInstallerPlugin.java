package com.neuralaegis.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    private static final String APK_FILENAME = "neural-aegis-update.apk";

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("Missing url");
            return;
        }

        if (getActivity() == null) {
            call.reject("Activity not available");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                settingsIntent.setData(Uri.parse("package:" + getContext().getPackageName()));
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(settingsIntent);
                call.reject(
                    "UNKNOWN_SOURCES_DISABLED",
                    "Allow installs from this app in Android settings, then retry."
                );
                return;
            }
        }

        call.resolve(new JSObject().put("started", true));

        new Thread(() -> {
            try {
                File apkFile = downloadApk(url.trim());
                if (getActivity() == null) {
                    notifyDownloadError("Activity not available");
                    return;
                }
                getActivity().runOnUiThread(() -> launchInstall(apkFile));
            } catch (Exception e) {
                notifyDownloadError(e.getMessage() != null ? e.getMessage() : "Download failed");
            }
        }).start();
    }

    private File getApkFile() {
        File dir = getContext().getExternalCacheDir();
        if (dir == null) {
            dir = getContext().getCacheDir();
        }
        return new File(dir, APK_FILENAME);
    }

    private File downloadApk(String urlString) throws Exception {
        File outFile = getApkFile();
        if (outFile.exists()) {
            //noinspection ResultOfMethodCallIgnored
            outFile.delete();
        }

        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(30_000);
        conn.setReadTimeout(120_000);
        conn.setInstanceFollowRedirects(true);
        conn.connect();

        int responseCode = conn.getResponseCode();
        if (responseCode < 200 || responseCode >= 300) {
            conn.disconnect();
            throw new Exception("HTTP " + responseCode);
        }

        int total = conn.getContentLength();
        try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(outFile)) {
            byte[] buffer = new byte[8192];
            long downloaded = 0;
            int read;
            int lastProgress = -1;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
                downloaded += read;
                if (total > 0) {
                    int progress = (int) ((downloaded * 100) / total);
                    if (progress != lastProgress) {
                        lastProgress = progress;
                        notifyProgress(progress);
                    }
                }
            }
        } finally {
            conn.disconnect();
        }

        notifyProgress(100);
        notifyListeners("downloadComplete", new JSObject());
        return outFile;
    }

    private void notifyProgress(int progress) {
        JSObject ev = new JSObject();
        ev.put("progress", progress);
        notifyListeners("downloadProgress", ev);
    }

    private void notifyDownloadError(String message) {
        JSObject err = new JSObject();
        err.put("message", message);
        notifyListeners("downloadError", err);
    }

    private void launchInstall(File apkFile) {
        Context ctx = getContext();
        Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", apkFile);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        notifyListeners("installIntentOpened", new JSObject());
        getActivity().startActivity(intent);
    }
}
