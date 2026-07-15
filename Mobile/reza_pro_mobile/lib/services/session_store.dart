import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SalonSummary {
  final String id;
  final String name;
  final String? city;

  const SalonSummary({
    required this.id,
    required this.name,
    this.city,
  });

  factory SalonSummary.fromJson(Map<String, dynamic> json) {
    return SalonSummary(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Salon',
      city: json['city']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        if (city != null) 'city': city,
      };
}

/// Shown when a global SUPER_ADMIN tries to use the mobile app.
const kSuperAdminMobileBlockedMessage =
    "Le compte super-admin n'est pas disponible sur l'application mobile. Utilisez la version web.";

class StaffUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String tenantId;
  final String? tenantName;

  const StaffUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.tenantId,
    this.tenantName,
  });

  String get name => '$firstName $lastName'.trim();

  /// Global platform superadmin — web-only; no tenant token on mobile.
  bool get isSuperAdmin {
    final r = role.trim().toUpperCase().replaceAll('-', '_');
    return r == 'SUPER_ADMIN' || r == 'SUPERADMIN';
  }

  factory StaffUser.fromJson(Map<String, dynamic> json) {
    final tenant = json['tenant'];
    // Backend may put role on user or (rarely) top-level / isSuperAdmin flag.
    final roleRaw = json['role']?.toString() ??
        (json['isSuperAdmin'] == true ? 'SUPER_ADMIN' : null) ??
        'STAFF';
    return StaffUser(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
      role: roleRaw,
      tenantId: json['tenantId']?.toString() ??
          (tenant is Map ? tenant['id']?.toString() : null) ??
          '',
      tenantName:
          tenant is Map ? tenant['name']?.toString() : json['tenantName']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
        'tenantId': tenantId,
        if (tenantName != null) 'tenant': {'id': tenantId, 'name': tenantName},
      };

  StaffUser copyWith({
    String? tenantId,
    String? tenantName,
  }) {
    return StaffUser(
      id: id,
      email: email,
      firstName: firstName,
      lastName: lastName,
      role: role,
      tenantId: tenantId ?? this.tenantId,
      tenantName: tenantName ?? this.tenantName,
    );
  }
}

class SessionStore {
  static const _tokenKey = 'reza_pro_token';
  static const _userKey = 'reza_pro_user';
  static const _salonsKey = 'reza_pro_salons';
  static const _activeTenantKey = 'reza_pro_active_tenant';
  /// Web `activeSalonIds`: `["all"]` or concrete tenant id list.
  static const _salonFilterKey = 'reza_pro_active_salon_ids';

  Future<void> save({
    required String token,
    required StaffUser user,
    List<SalonSummary>? salons,
    String? activeTenantId,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
    if (salons != null) {
      await prefs.setString(
        _salonsKey,
        jsonEncode(salons.map((s) => s.toJson()).toList()),
      );
    }
    final active = activeTenantId ?? user.tenantId;
    if (active.isNotEmpty) {
      await prefs.setString(_activeTenantKey, active);
    }
  }

  /// Persist multi-salon filter. [filter] is `'all'` or [List] of tenant ids.
  Future<void> saveSalonFilter(Object filter) async {
    final prefs = await SharedPreferences.getInstance();
    final value = filter == 'all' || (filter is List && filter.isEmpty)
        ? <String>['all']
        : List<String>.from((filter as List).map((e) => e.toString()));
    await prefs.setString(_salonFilterKey, jsonEncode(value));
  }

  /// Returns `'all'` or a non-empty [List]<[String]> of salon ids.
  Future<Object> getSalonFilter() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_salonFilterKey);
    if (raw == null || raw.isEmpty) return 'all';
    try {
      final parsed = jsonDecode(raw);
      if (parsed is List) {
        if (parsed.length == 1 && parsed[0] == 'all') return 'all';
        final ids = parsed.map((e) => e.toString()).where((e) => e.isNotEmpty).toList();
        return ids.isEmpty ? 'all' : ids;
      }
    } catch (_) {}
    return 'all';
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<StaffUser?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return StaffUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<List<SalonSummary>> getSalons() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_salonsKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List;
      return list
          .map((e) => SalonSummary.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<String?> getActiveTenantId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_activeTenantKey);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    await prefs.remove(_salonsKey);
    await prefs.remove(_activeTenantKey);
    // Keep salon filter prefs across logout (Web parity).
  }
}

final sessionStore = SessionStore();
