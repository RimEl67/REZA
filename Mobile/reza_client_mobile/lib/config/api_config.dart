import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Backend public API base (includes `/api`).
///
/// Priority:
/// 1. `--dart-define=API_BASE=...` (highest — use [scripts/run_dev.ps1] for auto LAN IP)
/// 2. Android default → emulator loopback `10.0.2.2` (wrong for physical unless script sets define)
/// 3. Web / iOS / desktop → `127.0.0.1`
///
/// Android Studio does not run the helper script. Either:
/// - Run Config → Additional run args: `--dart-define=API_BASE=http://<LAN_IP>:5000/api`
/// - Or run from terminal: `.\scripts\run_dev.ps1`
class ApiConfig {
  /// Override at build time: `--dart-define=API_BASE=http://192.168.1.10:5000/api`
  static const String _envBase = String.fromEnvironment('API_BASE', defaultValue: '');

  static String get baseUrl {
    if (_envBase.isNotEmpty) return _envBase.replaceAll(RegExp(r'/$'), '');
    if (kIsWeb) return 'http://127.0.0.1:5000/api';
    // Emulator default. Physical phone needs API_BASE from run_dev.ps1 (LAN IP)
    // or adb reverse + API_BASE=http://127.0.0.1:5000/api.
    if (Platform.isAndroid) return 'http://10.0.2.2:5000/api';
    return 'http://127.0.0.1:5000/api';
  }
}
