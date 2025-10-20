# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor WebView and JavaScript Interface
# Keep all Capacitor plugin classes and their methods
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * {
    @com.getcapacitor.PluginMethod public *;
}
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}

# Keep JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all plugin classes
-keep public class * extends com.getcapacitor.Plugin

# Keep Capacitor Bridge
-keep class com.getcapacitor.Bridge { *; }
-keep class com.getcapacitor.PluginHandle { *; }

# Preserve line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*

# Keep generic signature (for reflection)
-keepattributes Signature

# For native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Google Services / Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**
