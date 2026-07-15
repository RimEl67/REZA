import 'package:flutter/foundation.dart';
import '../services/account_service.dart';
import '../services/api_client.dart';

class BookingsViewModel extends ChangeNotifier {
  List<Map<String, dynamic>> upcoming = [];
  List<Map<String, dynamic>> past = [];
  bool loading = false;
  String? error;

  Map<String, dynamic> mapAppointment(Map<String, dynamic> a) {
    final start = DateTime.tryParse(a['startTime']?.toString() ?? '')?.toLocal();
    final service = a['service'] as Map<String, dynamic>?;
    final tenant = a['tenant'] as Map<String, dynamic>?;
    final status = (a['status']?.toString() ?? 'PENDING').toLowerCase();
    return {
      'id': a['id']?.toString() ?? '',
      'service': service?['name']?.toString() ?? 'Service',
      'salon': tenant?['name']?.toString() ?? 'Salon',
      'status': status,
      'date': start != null
          ? '${start.day.toString().padLeft(2, '0')}/${start.month.toString().padLeft(2, '0')}/${start.year}'
          : '',
      'time': start != null
          ? '${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')}'
          : '',
      '_dt': start,
      'raw': a,
    };
  }

  Future<void> load(String? email) async {
    if (email == null || email.isEmpty) {
      upcoming = [];
      past = [];
      loading = false;
      error = null;
      notifyListeners();
      return;
    }
    loading = true;
    error = null;
    notifyListeners();
    try {
      final list = await accountService.getAppointments(email);
      final now = DateTime.now();
      final up = <Map<String, dynamic>>[];
      final pa = <Map<String, dynamic>>[];
      for (final a in list) {
        final mapped = mapAppointment(a);
        final status = mapped['status'] as String;
        final dt = mapped['_dt'] as DateTime?;
        final isPast = status == 'completed' ||
            status == 'cancelled' ||
            status == 'no_show' ||
            (dt != null && dt.isBefore(now));
        if (isPast) {
          pa.add(mapped);
        } else {
          up.add(mapped);
        }
      }
      upcoming = up;
      past = pa;
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

  Future<void> cancel(String appointmentId, String email) async {
    await accountService.cancelAppointment(appointmentId, email);
    await load(email);
  }
}
