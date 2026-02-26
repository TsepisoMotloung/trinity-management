import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  User? _user;
  bool _isLoading = true;
  bool _isAuthenticated = false;

  AuthProvider(this._api) {
    _init();
  }

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  bool get isAdmin => _user?.role == Role.admin;

  Future<void> _init() async {
    _user = await _api.fetchCurrentUser();
    _isAuthenticated = _user != null;
    _isLoading = false;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    try {
      await _api.login(email, password);
      _user = await _api.fetchCurrentUser();
      _isAuthenticated = _user != null;
      notifyListeners();
      return null;
    } catch (e) {
      return _api.getErrorMessage(e);
    }
  }

  Future<String?> register(String firstName, String lastName, String email, String password, {String? phone}) async {
    try {
      await _api.register({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      });
      return null;
    } catch (e) {
      return _api.getErrorMessage(e);
    }
  }

  Future<void> logout() async {
    await _api.logout();
    _user = null;
    _isAuthenticated = false;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    _user = await _api.fetchCurrentUser();
    notifyListeners();
  }
}
