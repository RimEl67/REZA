import 'api_client.dart';

class AppointmentService {
  Future<List<Map<String, dynamic>>> list({
    String? startDate,
    String? endDate,
    String? employeeId,
    String? status,
    int page = 1,
    int limit = 100,
  }) async {
    final res = await apiClient.get('/appointments', query: {
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      if (employeeId != null && employeeId.isNotEmpty) 'employeeId': employeeId,
      if (status != null && status.isNotEmpty) 'status': status,
      'page': '$page',
      'limit': '$limit',
    });
    return List<Map<String, dynamic>>.from((res['appointments'] as List?) ?? []);
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    final res = await apiClient.post('/appointments', data);
    return Map<String, dynamic>.from(res['appointment'] as Map? ?? res);
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> data) async {
    final res = await apiClient.put('/appointments/$id', data);
    return Map<String, dynamic>.from(res['appointment'] as Map? ?? res);
  }

  Future<void> delete(String id) async {
    await apiClient.delete('/appointments/$id');
  }
}

final appointmentService = AppointmentService();
