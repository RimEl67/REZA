import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';
import '../services/session_store.dart';

class AuthViewModel extends ChangeNotifier {
  SessionUser? _user;
  bool _loading = true;

  SessionUser? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get loading => _loading;
  String? get email => _user?.email;

  Future<void> bootstrap() async {
    _user = await sessionStore.load();
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _user = await authService.login(email, password);
    notifyListeners();
  }

  Future<void> register({
    required String email,
    required String firstName,
    required String lastName,
    required String password,
    String? phone,
  }) async {
    _user = await authService.register(
      email: email,
      firstName: firstName,
      lastName: lastName,
      password: password,
      phone: phone,
    );
    notifyListeners();
  }

  Future<void> logout() async {
    await authService.logout();
    _user = null;
    notifyListeners();
  }

  Future<void> refreshFromStore() async {
    _user = await sessionStore.load();
    notifyListeners();
  }
}
