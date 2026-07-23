import 'api_client.dart';
import '../mock_data.dart';
import 'session_store.dart';

class InvoiceService {
  Future<List<Map<String, dynamic>>> list({
    String? startDate,
    String? endDate,
    String? status,
    int page = 1,
    int limit = 50,
  }) async {
    if (useMockData) {
      final sessionUser = await sessionStore.getUser();
      var data = getMockInvoices(sessionUser?.tenantId);

      if (status != null && status.isNotEmpty) {
        data = data.where((inv) => inv['status'] == status).toList();
      }

      return data;
    }

    final res = await apiClient.get('/invoices', query: {
      if (startDate != null) 'startDate': startDate,
      if (endDate != null) 'endDate': endDate,
      if (status != null) 'status': status,
      'page': '$page',
      'limit': '$limit',
    });
    return List<Map<String, dynamic>>.from((res['invoices'] as List?) ?? []);
  }

  Future<Map<String, dynamic>> stats({String? startDate, String? endDate}) async {
    if (useMockData) {
      final sessionUser = await sessionStore.getUser();
      final invoices = getMockInvoices(sessionUser?.tenantId);
      final totalRevenue = invoices
          .where((inv) => inv['status'] == 'PAID')
          .fold(0.0, (sum, inv) => sum + (inv['total'] as double));
      return {
        'totalRevenue': totalRevenue,
      };
    }

    try {
      return await apiClient.get('/invoices/stats', query: {
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      });
    } catch (_) {
      return {};
    }
  }

  // Flow A — encaisser une vente (PAID invoice + line items)
  Future<Map<String, dynamic>> createSale({
    required String clientId,
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    double? amount,
    double? tax,
    String? notes,
    String? tenantId,
    String? appointmentId,
  }) async {
    if (useMockData) {
      return {
        'id': generateId(),
        'invoiceNumber': 'INV-MOCK-${DateTime.now().millisecondsSinceEpoch}',
        'clientId': clientId,
        'items': items,
        'paymentMethod': paymentMethod,
        'amount': amount,
        'tax': tax,
        'total': amount,
        'status': 'PAID',
        'paidAt': DateTime.now().toIso8601String(),
        'createdAt': DateTime.now().toIso8601String(),
      };
    }

    final body = <String, dynamic>{
      'clientId': clientId,
      'items': items,
      'paymentMethod': paymentMethod,
      if (amount != null) 'amount': amount,
      if (tax != null) 'tax': tax,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      if (tenantId != null && tenantId.isNotEmpty) 'tenantId': tenantId,
      if (appointmentId != null && appointmentId.isNotEmpty)
        'appointmentId': appointmentId,
    };
    final res = await apiClient.post('/invoices/sale', body);
    return Map<String, dynamic>.from(res['invoice'] as Map? ?? res);
  }
}

final invoiceService = InvoiceService();
