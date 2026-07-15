import 'api_client.dart';

class InvoiceService {
  Future<List<Map<String, dynamic>>> list({
    String? startDate,
    String? endDate,
    String? status,
    int page = 1,
    int limit = 50,
  }) async {
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
    try {
      return await apiClient.get('/invoices/stats', query: {
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      });
    } catch (_) {
      return {};
    }
  }

  /// Flow A — encaisser une vente (PAID invoice + line items)
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
