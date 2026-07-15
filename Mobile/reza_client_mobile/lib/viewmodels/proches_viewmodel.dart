import 'package:flutter/foundation.dart';
import '../models/family_member.dart';
import '../services/account_service.dart';
import '../services/api_client.dart';

class ProchesViewModel extends ChangeNotifier {
  List<FamilyMember> members = [];
  bool loading = false;
  String? error;

  Future<void> load(String? email) async {
    if (email == null || email.isEmpty) {
      members = [];
      loading = false;
      error = null;
      notifyListeners();
      return;
    }
    loading = true;
    error = null;
    notifyListeners();
    try {
      members = await accountService.getFamilyMembers(email);
      loading = false;
      notifyListeners();
    } on ApiException catch (e) {
      error = e.message;
      loading = false;
      notifyListeners();
    } catch (e) {
      error = e.toString();
      loading = false;
      notifyListeners();
    }
  }

  Future<void> create({
    required String clientEmail,
    required String firstName,
    String lastName = '',
    required String relationship,
    String? phone,
    String? email,
  }) async {
    final m = await accountService.createFamilyMember(
      clientEmail: clientEmail,
      firstName: firstName,
      lastName: lastName,
      relationship: relationship,
      phone: phone,
      email: email,
    );
    members.insert(0, m);
    notifyListeners();
  }

  Future<void> remove(String id, String clientEmail) async {
    await accountService.deleteFamilyMember(id, clientEmail);
    members.removeWhere((m) => m.id == id);
    notifyListeners();
  }
}
