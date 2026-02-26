import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:3001/api/v1'; // Android emulator -> host
  
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'accessToken');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          try {
            final refreshToken = await _storage.read(key: 'refreshToken');
            if (refreshToken != null) {
              final response = await Dio().post(
                '$baseUrl/auth/refresh',
                data: {'refreshToken': refreshToken},
              );
              final newAccess = response.data['accessToken'];
              final newRefresh = response.data['refreshToken'];
              await _storage.write(key: 'accessToken', value: newAccess);
              await _storage.write(key: 'refreshToken', value: newRefresh);
              error.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
              final retryResponse = await _dio.fetch(error.requestOptions);
              return handler.resolve(retryResponse);
            }
          } catch (_) {
            await _storage.deleteAll();
          }
        }
        handler.next(error);
      },
    ));
  }

  String getErrorMessage(dynamic error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final msg = data['message'];
        if (msg is List) return msg.join(', ');
        if (msg is String) return msg;
      }
      return error.message ?? 'An error occurred';
    }
    return error.toString();
  }

  // ── Auth ──
  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    await _storage.write(key: 'accessToken', value: res.data['accessToken']);
    await _storage.write(key: 'refreshToken', value: res.data['refreshToken']);
    return res.data;
  }

  Future<void> register(Map<String, dynamic> data) async {
    await _dio.post('/auth/register', data: data);
  }

  Future<User?> fetchCurrentUser() async {
    try {
      final res = await _dio.post('/auth/me');
      return User.fromJson(res.data);
    } catch (_) {
      return null;
    }
  }

  Future<void> logout() async {
    try {
      final rt = await _storage.read(key: 'refreshToken');
      await _dio.post('/auth/logout', data: {'refreshToken': rt});
    } catch (_) {}
    await _storage.deleteAll();
  }

  Future<void> forgotPassword(String email) async {
    await _dio.post('/auth/forgot-password', data: {'email': email});
  }

  Future<void> resetPassword(String token, String newPassword) async {
    await _dio.post('/auth/reset-password', data: {'token': token, 'newPassword': newPassword});
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _dio.post('/auth/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  // ── Equipment ──
  Future<List<EquipmentCategory>> getCategories() async {
    final res = await _dio.get('/equipment/categories');
    return (res.data as List).map((e) => EquipmentCategory.fromJson(e)).toList();
  }

  Future<List<EquipmentItem>> getEquipmentItems({String? search, String? status, String? categoryId, int take = 50}) async {
    final res = await _dio.get('/equipment/items', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      if (categoryId != null && categoryId.isNotEmpty) 'categoryId': categoryId,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['items'] ?? data);
    return (list as List).map((e) => EquipmentItem.fromJson(e)).toList();
  }

  Future<EquipmentItem> getEquipmentItem(String id) async {
    final res = await _dio.get('/equipment/items/$id');
    return EquipmentItem.fromJson(res.data);
  }

  Future<EquipmentStatistics> getEquipmentStatistics() async {
    final res = await _dio.get('/equipment/statistics');
    return EquipmentStatistics.fromJson(res.data);
  }

  Future<List<EquipmentItem>> getAvailableEquipment(String startDate, String endDate, {String? excludeEventId}) async {
    final res = await _dio.get('/equipment/available', queryParameters: {
      'startDate': startDate,
      'endDate': endDate,
      if (excludeEventId != null) 'excludeEventId': excludeEventId,
    });
    return (res.data as List).map((e) => EquipmentItem.fromJson(e)).toList();
  }

  Future<EquipmentItem> createEquipmentItem(Map<String, dynamic> data) async {
    final res = await _dio.post('/equipment/items', data: data);
    return EquipmentItem.fromJson(res.data);
  }

  Future<void> updateEquipmentItem(String id, Map<String, dynamic> data) async {
    await _dio.patch('/equipment/items/$id', data: data);
  }

  Future<void> updateEquipmentStatus(String id, String status, {String? reason}) async {
    await _dio.patch('/equipment/items/$id/status', data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<void> deleteEquipmentItem(String id) async {
    await _dio.delete('/equipment/items/$id');
  }

  // ── Events ──
  Future<List<Event>> getEvents({String? search, String? status, int take = 50}) async {
    final res = await _dio.get('/events', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['items'] ?? data);
    return (list as List).map((e) => Event.fromJson(e)).toList();
  }

  Future<Event> getEvent(String id) async {
    final res = await _dio.get('/events/$id');
    return Event.fromJson(res.data);
  }

  Future<Map<String, dynamic>> getEventStatistics() async {
    final res = await _dio.get('/events/statistics');
    return res.data;
  }

  Future<List<User>> getAvailableStaff(String startDate, String endDate, {String? excludeEventId}) async {
    final res = await _dio.get('/events/available-staff', queryParameters: {
      'startDate': startDate,
      'endDate': endDate,
      if (excludeEventId != null) 'excludeEventId': excludeEventId,
    });
    return (res.data as List).map((e) => User.fromJson(e)).toList();
  }

  Future<Event> createEvent(Map<String, dynamic> data) async {
    final res = await _dio.post('/events', data: data);
    return Event.fromJson(res.data);
  }

  Future<void> updateEvent(String id, Map<String, dynamic> data) async {
    await _dio.patch('/events/$id', data: data);
  }

  Future<void> updateEventStatus(String id, String status) async {
    await _dio.patch('/events/$id/status', data: {'status': status});
  }

  Future<void> addEquipmentToEvent(String eventId, Map<String, dynamic> data) async {
    await _dio.post('/events/$eventId/equipment', data: data);
  }

  Future<void> removeEquipmentFromEvent(String eventId, String bookingId) async {
    await _dio.delete('/events/$eventId/equipment/$bookingId');
  }

  Future<void> addStaffToEvent(String eventId, Map<String, dynamic> data) async {
    await _dio.post('/events/$eventId/staff', data: data);
  }

  Future<void> removeStaffFromEvent(String eventId, String assignmentId) async {
    await _dio.delete('/events/$eventId/staff/$assignmentId');
  }

  // ── Clients ──
  Future<List<Client>> getClients({String? search, bool? isActive, int take = 50}) async {
    final res = await _dio.get('/clients', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (isActive != null) 'isActive': isActive,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['items'] ?? data);
    return (list as List).map((e) => Client.fromJson(e)).toList();
  }

  Future<Client> getClient(String id) async {
    final res = await _dio.get('/clients/$id');
    return Client.fromJson(res.data);
  }

  Future<Client> createClient(Map<String, dynamic> data) async {
    final res = await _dio.post('/clients', data: data);
    return Client.fromJson(res.data);
  }

  Future<void> updateClient(String id, Map<String, dynamic> data) async {
    await _dio.put('/clients/$id', data: data);
  }

  Future<void> deactivateClient(String id) async {
    await _dio.patch('/clients/$id/deactivate');
  }

  // ── Quotes ──
  Future<List<Quote>> getQuotes({String? search, String? status, int take = 50}) async {
    final res = await _dio.get('/finance/quotes', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['quotes'] ?? data['items'] ?? data);
    return (list as List).map((e) => Quote.fromJson(e)).toList();
  }

  Future<Quote> getQuote(String id) async {
    final res = await _dio.get('/finance/quotes/$id');
    return Quote.fromJson(res.data);
  }

  Future<Quote> createQuote(Map<String, dynamic> data) async {
    final res = await _dio.post('/finance/quotes', data: data);
    return Quote.fromJson(res.data);
  }

  Future<void> updateQuoteStatus(String id, String status) async {
    await _dio.patch('/finance/quotes/$id/status', data: {'status': status});
  }

  Future<void> deleteQuote(String id) async {
    await _dio.delete('/finance/quotes/$id');
  }

  Future<void> sendQuote(String id, String email, String message) async {
    await _dio.post('/finance/quotes/$id/send', data: {'email': email, 'message': message});
  }

  // ── Invoices ──
  Future<List<Invoice>> getInvoices({String? search, String? status, int take = 50}) async {
    final res = await _dio.get('/finance/invoices', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['invoices'] ?? data['items'] ?? data);
    return (list as List).map((e) => Invoice.fromJson(e)).toList();
  }

  Future<Invoice> getInvoice(String id) async {
    final res = await _dio.get('/finance/invoices/$id');
    return Invoice.fromJson(res.data);
  }

  Future<Invoice> createInvoice(Map<String, dynamic> data) async {
    final res = await _dio.post('/finance/invoices', data: data);
    return Invoice.fromJson(res.data);
  }

  Future<void> updateInvoiceStatus(String id, String status) async {
    await _dio.patch('/finance/invoices/$id/status', data: {'status': status});
  }

  Future<Invoice> createInvoiceFromQuote(String quoteId) async {
    final res = await _dio.post('/finance/invoices/from-quote', data: {'quoteId': quoteId});
    return Invoice.fromJson(res.data);
  }

  Future<void> recordPayment(Map<String, dynamic> data) async {
    await _dio.post('/finance/payments', data: data);
  }

  // ── Finance Summary ──
  Future<FinancialSummary> getFinancialSummary() async {
    final res = await _dio.get('/finance/summary');
    return FinancialSummary.fromJson(res.data);
  }

  // ── Transactions ──
  Future<List<CheckOutTransaction>> getPendingTransactions() async {
    final res = await _dio.get('/transactions/pending');
    return (res.data as List).map((e) => CheckOutTransaction.fromJson(e)).toList();
  }

  Future<List<CheckOutTransaction>> getOverdueTransactions() async {
    final res = await _dio.get('/transactions/overdue');
    return (res.data as List).map((e) => CheckOutTransaction.fromJson(e)).toList();
  }

  Future<Map<String, dynamic>> getEventTransactions(String eventId) async {
    final res = await _dio.get('/transactions/event/$eventId');
    return res.data;
  }

  Future<void> checkOutEquipment(Map<String, dynamic> data) async {
    await _dio.post('/transactions/check-out', data: data);
  }

  Future<void> checkInEquipment(Map<String, dynamic> data) async {
    await _dio.post('/transactions/check-in', data: data);
  }

  // ── Maintenance ──
  Future<List<MaintenanceTicket>> getMaintenanceTickets({String? search, String? status, String? priority, int take = 50}) async {
    final res = await _dio.get('/maintenance', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (status != null && status.isNotEmpty) 'status': status,
      if (priority != null && priority.isNotEmpty) 'priority': priority,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['tickets'] ?? data['items'] ?? data);
    return (list as List).map((e) => MaintenanceTicket.fromJson(e)).toList();
  }

  Future<MaintenanceTicket> createMaintenanceTicket(Map<String, dynamic> data) async {
    final res = await _dio.post('/maintenance', data: data);
    return MaintenanceTicket.fromJson(res.data);
  }

  Future<void> updateMaintenanceStatus(String id, String status, {String? notes}) async {
    await _dio.patch('/maintenance/$id/status', data: {'status': status, if (notes != null) 'notes': notes});
  }

  Future<void> completeMaintenance(String id) async {
    await _dio.post('/maintenance/$id/complete');
  }

  Future<void> assignMaintenance(String id, String userId) async {
    await _dio.put('/maintenance/$id', data: {'assignedToId': userId});
  }

  Future<void> deleteMaintenance(String id) async {
    await _dio.delete('/maintenance/$id');
  }

  // ── Users ──
  Future<List<User>> getUsers({String? search, bool? isActive, int take = 100}) async {
    final res = await _dio.get('/users', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (isActive != null) 'isActive': isActive,
      'take': take,
    });
    final data = res.data;
    final list = data is List ? data : (data['items'] ?? data);
    return (list as List).map((e) => User.fromJson(e)).toList();
  }

  Future<void> approveUser(String id) async {
    await _dio.post('/users/$id/approve');
  }

  Future<void> rejectUser(String id) async {
    await _dio.post('/users/$id/reject');
  }

  Future<void> updateUser(String id, Map<String, dynamic> data) async {
    await _dio.patch('/users/$id', data: data);
  }

  Future<void> deleteUser(String id) async {
    await _dio.delete('/users/$id');
  }

  // ── Action Logs ──
  Future<List<ActionLog>> getActionLogs({String? search, String? entityType, int take = 50, int page = 1}) async {
    final res = await _dio.get('/action-logs', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
      if (entityType != null && entityType.isNotEmpty) 'entityType': entityType,
      'take': take,
      'page': page,
    });
    final data = res.data;
    final list = data is List ? data : (data['items'] ?? data['logs'] ?? data);
    return (list as List).map((e) => ActionLog.fromJson(e)).toList();
  }

  // ── Notifications ──
  Future<List<AppNotification>> getNotifications({int take = 20, bool? isRead}) async {
    final res = await _dio.get('/notifications', queryParameters: {
      'take': take,
      if (isRead != null) 'isRead': isRead,
    });
    final data = res.data;
    final list = data is List ? data : (data['notifications'] ?? data['items'] ?? data);
    return (list as List).map((e) => AppNotification.fromJson(e)).toList();
  }

  Future<void> markNotificationRead(String id) async {
    await _dio.patch('/notifications/$id/read');
  }

  Future<void> markAllNotificationsRead() async {
    await _dio.patch('/notifications/read-all');
  }
}
