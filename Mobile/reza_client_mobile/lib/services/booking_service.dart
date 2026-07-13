import 'api_client.dart';

class BookingService {
  Future<Map<String, dynamic>> createBooking({
    required String tenantId,
    required String firstName,
    required String lastName,
    required String phone,
    String? email,
    required List<String> serviceIds,
    required String startTimeIso,
    String? notes,
    bool includeBooker = true,
    List<Map<String, dynamic>>? participants,
  }) async {
    return apiClient.post('/public/bookings', {
      'tenantId': tenantId,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      if (email != null && email.isNotEmpty) 'email': email,
      'serviceIds': serviceIds,
      'startTime': startTimeIso,
      'includeBooker': includeBooker,
      if (notes != null) 'notes': notes,
      if (participants != null && participants.isNotEmpty) 'participants': participants,
    });
  }
}

final bookingService = BookingService();
