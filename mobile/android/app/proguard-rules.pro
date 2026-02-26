## Flutter/Dart specific ProGuard rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

## Dio HTTP client
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions
-dontwarn retrofit2.**

## Keep model classes for JSON serialization
-keep class com.trinitysound.mobile.** { *; }

## flutter_secure_storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

## Google Fonts
-keep class com.google.android.gms.** { *; }

## General Android
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

## Prevent obfuscation of classes used by reflection
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

## Kotlin
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings {
    <fields>;
}
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}
