import 'api_client.dart';
import '../mock_data.dart';
import 'session_store.dart';

class CashTransactionService {
  Future<List<Map<String, dynamic>>> list({
    String? startDate,
    String? endDate,
    String? type,
    int page = 1,
    int limit = 50,
  }) async {
    if (useMockData) {
      final sessionUser = await sessionStore.getUser();
      final data = sessionUser?.tenantId == 'mock-salon-1'
          ? getMockCashTransactionsSalon1()
          : <Map<String, dynamic>>[];

      if (type != null && type != 'all') {
        return data.where((tx) => tx['type'] == type).toList();
      }
      return data;
    }

    final res = await apiClient.get('/cash-transactions', query: {
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      if (type != null && type != 'all') 'type': type,
      'page': '$page',
      'limit': '$limit',
    });
    return List<Map<String, dynamic>>.from(
        (res['cashTransactions'] as List?) ??
            (res['transactions'] as List?) ??
            (res['data'] as List?) ??
            []);
  }

  Future<Map<String, dynamic>> create({
    required String type, // DEPOSIT | WITHDRAWAL | REFUND
    required double amount,
    required String paymentMethod,
    String? notes,
    String? tenantId,
  }) async {
    if (useMockData) {
      return {
        'id': generateId(),
        'type': type,
        'amount': amount,
        'paymentMethod': paymentMethod,
        'notes': notes,
        'createdAt': DateTime.now().toIso8601String(),
      };
    }

    final res = await apiClient.post('/cash-transactions', {
      'type': type,
      'amount': amount,
      'paymentMethod': paymentMethod,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      if (tenantId != null && tenantId.isNotEmpty) 'tenantId': tenantId,
    });
    return Map<String, dynamic>.from(
        res['cashTransaction'] as Map? ?? res['transaction'] as Map? ?? res);
  }
}

final cashTransactionService = CashTransactionService();
