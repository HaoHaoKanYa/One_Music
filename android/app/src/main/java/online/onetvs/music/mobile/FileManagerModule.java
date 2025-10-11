package online.onetvs.music.mobile;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;

public class FileManagerModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    FileManagerModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "FileManagerModule";
    }

    @ReactMethod
    public void openFolder(String folderPath, Promise promise) {
        try {
            File folder = new File(folderPath);
            
            if (!folder.exists()) {
                promise.reject("ERROR", "文件夹不存在");
                return;
            }

            // 尝试多种方式打开文件管理器
            boolean opened = false;
            
            // 方法1: 使用 ACTION_VIEW 打开文件夹
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                Uri uri = Uri.parse("file://" + folderPath);
                intent.setDataAndType(uri, "resource/folder");
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
                reactContext.startActivity(intent);
                opened = true;
            } catch (Exception e) {
                // 方法1失败，继续尝试方法2
            }
            
            // 方法2: 使用 DocumentsUI 打开
            if (!opened) {
                try {
                    Intent intent = new Intent("android.intent.action.VIEW");
                    intent.setClassName("com.android.documentsui", "com.android.documentsui.files.FilesActivity");
                    intent.putExtra("android.provider.extra.INITIAL_URI", Uri.parse("file://" + folderPath));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    reactContext.startActivity(intent);
                    opened = true;
                } catch (Exception e) {
                    // 方法2失败，继续尝试方法3
                }
            }
            
            // 方法3: 打开文件选择器（降级方案）
            if (!opened) {
                Intent fallbackIntent = new Intent(Intent.ACTION_GET_CONTENT);
                fallbackIntent.setType("*/*");
                fallbackIntent.addCategory(Intent.CATEGORY_OPENABLE);
                fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                
                Intent chooser = Intent.createChooser(fallbackIntent, "打开文件管理器");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(chooser);
                opened = true;
            }
            
            if (opened) {
                promise.resolve(true);
            } else {
                promise.reject("ERROR", "无法打开文件管理器");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
