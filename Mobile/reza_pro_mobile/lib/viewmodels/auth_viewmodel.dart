import 'package:flutter/foundation.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/session_store.dart';

class AuthViewModel extends ChangeNotifier {
  StaffUser? _user;
  String? _token;
  List<SalonSummary> _salons = [];
  String? _activeTenantId;
  bool _booting = true;
  bool _switchingSalon = false;

  /// `null` means all salons; otherwise selected tenant ids.
  List<String>? _salonFilterIds;

  bool get isAuthenticated => _token != null && _user != null;
  bool get isBooting => _booting;
  bool get isSwitchingSalon => _switchingSalon;
  StaffUser? get user => _user;
  String? get token => _token;
  List<SalonSummary> get salons => _salons;
  String? get activeTenantId => _activeTenantId ?? _user?.tenantId;

  String get activeSalonName {
    final id = activeTenantId;
    if (id == null || id.isEmpty) return _user?.tenantName ?? 'Salon';
    for (final s in _salons) {
      if (s.id == id) return s.name;
    }
    return _user?.tenantName ?? 'Salon';
  }

  bool get hasMultipleSalons => _salons.length > 1;

  /// `true` when filter is “Tous les salons”.
  bool get isSalonFilterAll =>
      _salonFilterIds == null ||
      (_salons.isNotEmpty && effectiveSalonIds.length == _salons.length);

  List<String> get effectiveSalonIds {
    if (_salons.isEmpty) {
      final id = activeTenantId;
      return id != null && id.isNotEmpty ? [id] : [];
    }
    if (_salonFilterIds == null) return _salons.map((s) => s.id).toList();
    return _salonFilterIds!
        .where((id) => _salons.any((s) => s.id == id))
        .toList();
  }

  bool get isSalonFilterMulti => effectiveSalonIds.length > 1;

  /// Header chip label: “Tous les salons” / name / “N salons”.
  String get salonFilterLabel {
    final ids = effectiveSalonIds;
    if (isSalonFilterAll || ids.length == _salons.length) {
      return 'Tous les salons';
    }
    if (ids.length == 1) {
      for (final s in _salons) {
        if (s.id == ids.first) return s.name;
      }
      return '1 salon';
    }
    return '${ids.length} salons';
  }

  /// Stable key so dashboard can refetch when salon filter changes (no remount).
  String get salonFilterScopeKey {
    if (isSalonFilterAll) return 'all';
    final ids = [...effectiveSalonIds]..sort();
    return ids.isEmpty ? 'all' : ids.join(',');
  }

  AuthViewModel() {
    apiClient.tokenGetter = () async => _token ?? await sessionStore.getToken();
    apiClient.onUnauthorized = () async {
      await logout(callApi: false);
    };
    _boot();
  }

  Future<void> _persistSalonFilter() async {
    if (_salonFilterIds == null) {
      await sessionStore.saveSalonFilter('all');
    } else {
      final ids = effectiveSalonIds;
      await sessionStore.saveSalonFilter(
        ids.length == _salons.length ? 'all' : ids,
      );
    }
  }

  void _sanitizeSalonFilter() {
    if (_salons.isEmpty) return;
    if (_salonFilterIds == null) {
      apiClient.setSalonFilter('all');
      return;
    }
    final valid =
        _salonFilterIds!.where((id) => _salons.any((s) => s.id == id)).toList();
    if (valid.isEmpty) {
      _salonFilterIds = null;
      apiClient.setSalonFilter('all');
    } else if (valid.length == _salons.length) {
      _salonFilterIds = null;
      apiClient.setSalonFilter('all');
    } else {
      _salonFilterIds = valid;
      apiClient.setSalonFilter(valid);
    }
  }

  Future<void> setSalonFilterAll() async {
    _salonFilterIds = null;
    apiClient.setSalonFilter('all');
    await _persistSalonFilter();
    notifyListeners();
  }

  Future<void> setSalonFilterIds(List<String> ids) async {
    final cleaned = ids.where((id) => id.isNotEmpty).toSet().toList();
    if (cleaned.isEmpty ||
        (_salons.isNotEmpty && cleaned.length == _salons.length)) {
      await setSalonFilterAll();
      return;
    }
    _salonFilterIds = cleaned;
    apiClient.setSalonFilter(cleaned);
    await _persistSalonFilter();
    notifyListeners();
  }

  void _applySession(AuthSession session, {String? keepToken}) {
    if (session.token.isNotEmpty) {
      _token = session.token;
    } else if (keepToken != null) {
      _token = keepToken;
    }
    _user = session.user;
    if (session.salons.isNotEmpty) {
      _salons = session.salons;
    }
    _activeTenantId = session.activeTenantId ?? session.user.tenantId;
    _sanitizeSalonFilter();
  }

  Future<void> _persist() async {
    final token = _token;
    final user = _user;
    if (token == null || user == null) return;
    await sessionStore.save(
      token: token,
      user: user,
      salons: _salons,
      activeTenantId: _activeTenantId,
    );
  }

  Future<void> _boot() async {
    try {
      final token = await sessionStore.getToken();
      final cached = await sessionStore.getUser();
      final cachedSalons = await sessionStore.getSalons();
      final cachedActive = await sessionStore.getActiveTenantId();
      final savedFilter = await sessionStore.getSalonFilter();

      if (savedFilter == 'all') {
        _salonFilterIds = null;
      } else if (savedFilter is List) {
        _salonFilterIds = savedFilter.map((e) => e.toString()).toList();
      }

      if (token == null || token.isEmpty) {
        _booting = false;
        notifyListeners();
        return;
      }
      // Stale / mis-saved superadmin session — never enter app as authenticated.
      if (cached?.isSuperAdmin == true) {
        await sessionStore.clear();
        _booting = false;
        notifyListeners();
        return;
      }
      _token = token;
      _user = cached;
      _salons = cachedSalons;
      _activeTenantId = cachedActive ?? cached?.tenantId;
      _sanitizeSalonFilter();
      notifyListeners();
      try {
        final me = await authService.me();
        if (me.user.isSuperAdmin) {
          await logout(callApi: false);
          return;
        }
        _applySession(me, keepToken: token);
        await _persist();
        await _persistSalonFilter();
      } catch (_) {
        await logout(callApi: false);
      }
    } finally {
      _booting = false;
      notifyListeners();
    }
  }

  /// Always persists session (reopen app → still logged in).
  Future<void> login(String email, String password) async {
    final session = await authService.login(email, password);
    // Defense in depth (auth_service already rejects SUPER_ADMIN).
    if (session.user.isSuperAdmin) {
      await logout(callApi: false);
      throw ApiException(kSuperAdminMobileBlockedMessage);
    }
    // Restore saved filter after login (Web keeps activeSalonIds across logout).
    final savedFilter = await sessionStore.getSalonFilter();
    if (savedFilter == 'all') {
      _salonFilterIds = null;
    } else if (savedFilter is List) {
      _salonFilterIds = savedFilter.map((e) => e.toString()).toList();
    }
    _applySession(session);
    await _persist();
    await _persistSalonFilter();
    notifyListeners();
  }

  Future<void> switchSalon(String tenantId) async {
    if (tenantId.isEmpty || tenantId == activeTenantId) return;
    _switchingSalon = true;
    notifyListeners();
    try {
      final session = await authService.switchSalon(tenantId);
      _applySession(session);
      // Web: switchSalon also narrows filter to that salon.
      await setSalonFilterIds([tenantId]);
      await _persist();
    } finally {
      _switchingSalon = false;
      notifyListeners();
    }
  }

  Future<void> logout({bool callApi = true}) async {
    if (callApi) {
      await authService.logout();
    }
    _token = null;
    _user = null;
    _salons = [];
    _activeTenantId = null;
    // Keep _salonFilterIds / prefs for next login.
    apiClient.setSalonFilter('all');
    await sessionStore.clear();
    notifyListeners();
  }
}
