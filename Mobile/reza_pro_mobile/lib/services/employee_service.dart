import 'api_client.dart';
import '../mock_data.dart';
import 'session_store.dart';

class EmployeeService {
  Future<List<Map<String, dynamic>>> list({bool? active}) async {
    if (useMockData) {
      // Get current tenant from session store
      final sessionUser = await sessionStore.getUser();
      return getMockEmployees(sessionUser?.tenantId);
    }

    final res = await apiClient.get('/employees', query: {
      if (active != null) 'active': active.toString(),
    });
    return List<Map<String, dynamic>>.from((res['employees'] as List?) ?? []);
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> data) async {
    if (useMockData) {
      // Return a mock employee
      return {
        'id': generateId(),
        ...data,
      };
    }

    final res = await apiClient.post('/employees', data);
    return Map<String, dynamic>.from(res['employee'] as Map? ?? res);
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> data) async {
    if (useMockData) {
      // Return updated mock data
      return {
        'id': id,
        ...data,
      };
    }

    final res = await apiClient.put('/employees/$id', data);
    return Map<String, dynamic>.from(res['employee'] as Map? ?? res);
  }

  Future<void> delete(String id) async {
    if (!useMockData) {
      await apiClient.delete('/employees/$id');
    }
  }
}

final employeeService = EmployeeService();
