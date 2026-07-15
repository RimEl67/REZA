import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Staff API base (includes `/api`).
/// Override: `--dart-define=API_BASE=http://192.168.x.x:5000/api`
class ApiConfig {
  static const String _envBase = String.fromEnvironment('API_BASE', defaultValue: '');

  static String get baseUrl {
    if (_envBase.isNotEmpty) return _envBase.replaceAll(RegExp(r'/$'), '');
    if (kIsWeb) return 'http://127.0.0.1:5000/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:5000/api';
    return 'http://127.0.0.1:5000/api';
  }
}
