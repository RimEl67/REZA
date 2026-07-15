import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../models/appointment.dart';
import '../services/api_client.dart';
import '../services/appointment_service.dart';
import '../services/client_service.dart';
import '../services/employee_service.dart';
import '../services/service_catalog_service.dart';

class NewAppointmentModal extends StatefulWidget {
  final DateTime selectedDate;
  final Function(Appointment) onAdd;

  const NewAppointmentModal({
    super.key,
    required this.selectedDate,
    required this.onAdd,
  });

  @override
  State<NewAppointmentModal> createState() => _NewAppointmentModalState();
}

class _NewAppointmentModalState extends State<NewAppointmentModal> {
  final _notesController = TextEditingController();

  List<Map<String, dynamic>> _clients = [];
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _employees = [];

  String? _selectedClientId;
  String? _selectedServiceId;
  String? _selectedEmployeeId;
  String _selectedTime = '09:00';
  int _selectedDuration = 60;
  bool _loading = true;
  bool _submitting = false;
  String? _loadError;

  final List<String> _times = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final results = await Future.wait([
        clientService.list(limit: 200),
        serviceCatalogService.list(),
        employeeService.list(active: true),
      ]);
      if (!mounted) return;
      setState(() {
        _clients = results[0];
        _services = results[1];
        _employees = results[2];
        if (_clients.isNotEmpty) {
          _selectedClientId = _clients.first['id']?.toString();
        }
        if (_services.isNotEmpty) {
          _selectedServiceId = _services.first['id']?.toString();
          _selectedDuration =
              (_services.first['duration'] as num?)?.toInt() ?? 60;
        }
        if (_employees.isNotEmpty) {
          _selectedEmployeeId = _employees.first['id']?.toString();
        }
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loadError = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadError = 'Impossible de charger les données';
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Map<String, dynamic>? get _selectedService {
    if (_selectedServiceId == null) return null;
    try {
      return _services.firstWhere((s) => s['id']?.toString() == _selectedServiceId);
    } catch (_) {
      return null;
    }
  }

  Future<void> _submit() async {
    if (_selectedClientId == null || _selectedServiceId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Sélectionnez un client et une prestation',
              style: GoogleFonts.outfit(fontSize: 13)),
          backgroundColor: AppColors.cancelled,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final parts = _selectedTime.split(':');
    final hour = int.parse(parts[0]);
    final minute = int.parse(parts[1]);
    final startLocal = DateTime(
      widget.selectedDate.year,
      widget.selectedDate.month,
      widget.selectedDate.day,
      hour,
      minute,
    );
    final duration =
        (_selectedService?['duration'] as num?)?.toInt() ?? _selectedDuration;

    setState(() => _submitting = true);
    try {
      final created = await appointmentService.create({
        'clientId': _selectedClientId,
        'serviceId': _selectedServiceId,
        if (_selectedEmployeeId != null && _selectedEmployeeId!.isNotEmpty)
          'employeeId': _selectedEmployeeId,
        'startTime': startLocal.toUtc().toIso8601String(),
        'duration': duration,
        if (_notesController.text.trim().isNotEmpty)
          'notes': _notesController.text.trim(),
        'status': 'CONFIRMED',
      });
      if (!mounted) return;
      final appointment = Appointment.fromJson(created);
      widget.onAdd(appointment);
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Rendez-vous ajouté avec succès',
              style: GoogleFonts.outfit(fontSize: 13)),
          backgroundColor: AppColors.confirmed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.message, style: GoogleFonts.outfit(fontSize: 13)),
          backgroundColor: AppColors.cancelled,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Création impossible', style: GoogleFonts.outfit(fontSize: 13)),
          backgroundColor: AppColors.cancelled,
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _label(Map<String, dynamic> item, {bool service = false}) {
    if (service) return item['name']?.toString() ?? 'Service';
    return '${item['firstName'] ?? ''} ${item['lastName'] ?? ''}'.trim();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (ctx, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
        ),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : _loadError != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_loadError!, textAlign: TextAlign.center),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _loadData,
                            child: const Text('Réessayer'),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    controller: scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                    children: [
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.border,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.add_rounded,
                                color: AppColors.primary, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Nouveau rendez-vous',
                                style: GoogleFonts.outfit(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textDark,
                                ),
                              ),
                              Text(
                                DateFormat('EEEE d MMMM yyyy', 'fr_FR')
                                    .format(widget.selectedDate),
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  color: AppColors.textGray,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _sectionLabel('CLIENT'),
                      const SizedBox(height: 8),
                      _idDropdown(
                        'Client',
                        _selectedClientId,
                        _clients,
                        (v) => setState(() => _selectedClientId = v),
                      ),
                      const SizedBox(height: 20),
                      _sectionLabel('PRESTATION'),
                      const SizedBox(height: 8),
                      _idDropdown(
                        'Service',
                        _selectedServiceId,
                        _services,
                        (v) {
                          setState(() {
                            _selectedServiceId = v;
                            final svc = _selectedService;
                            if (svc != null) {
                              _selectedDuration =
                                  (svc['duration'] as num?)?.toInt() ?? 60;
                            }
                          });
                        },
                        asService: true,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Durée: $_selectedDuration min',
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          color: AppColors.textGray,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _sectionLabel('PLANIFICATION'),
                      const SizedBox(height: 8),
                      _timePicker(),
                      const SizedBox(height: 12),
                      _idDropdown(
                        'Collaborateur',
                        _selectedEmployeeId,
                        _employees,
                        (v) => setState(() => _selectedEmployeeId = v),
                        optional: true,
                      ),
                      const SizedBox(height: 20),
                      _sectionLabel('NOTES'),
                      const SizedBox(height: 8),
                      _textField(_notesController, 'Notes (facultatif)',
                          'Informations supplémentaires...',
                          maxLines: 3),
                      const SizedBox(height: 28),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton.icon(
                          onPressed: _submitting ? null : _submit,
                          icon: _submitting
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.check_rounded, size: 20),
                          label: Text(
                            'Créer le rendez-vous',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(26),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.outfit(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.textLight,
        letterSpacing: 1.2,
      ),
    );
  }

  Widget _textField(
    TextEditingController ctrl,
    String label,
    String hint, {
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
          style: GoogleFonts.outfit(fontSize: 14, color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle:
                GoogleFonts.outfit(fontSize: 13, color: AppColors.textLight),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            filled: true,
            fillColor: AppColors.surfaceGray,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _idDropdown(
    String label,
    String? value,
    List<Map<String, dynamic>> items,
    ValueChanged<String?> onChanged, {
    bool asService = false,
    bool optional = false,
  }) {
    final menuItems = <DropdownMenuItem<String>>[
      if (optional)
        const DropdownMenuItem(value: '', child: Text('Aucun')),
      ...items.map((e) {
        final id = e['id']?.toString() ?? '';
        return DropdownMenuItem(
          value: id,
          child: Text(_label(e, service: asService)),
        );
      }),
    ];
    final effectiveValue = value != null &&
            menuItems.any((m) => m.value == value)
        ? value
        : (menuItems.isNotEmpty ? menuItems.first.value : null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppColors.surfaceGray,
            border: Border.all(color: AppColors.border),
            borderRadius: BorderRadius.circular(12),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: effectiveValue,
              isExpanded: true,
              icon: const Icon(Icons.expand_more_rounded,
                  size: 20, color: AppColors.textGray),
              style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textDark),
              items: menuItems,
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _timePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Heure',
            style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark)),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _times.map((t) {
              final selected = t == _selectedTime;
              return GestureDetector(
                onTap: () => setState(() => _selectedTime = t),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(right: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Text(
                    t,
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : AppColors.textGray,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
