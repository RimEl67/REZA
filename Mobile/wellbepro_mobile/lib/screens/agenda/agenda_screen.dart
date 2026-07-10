import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../constants/app_colors.dart';
import '../../models/appointment.dart';
import '../../widgets/appointment_card.dart';
import '../../widgets/new_appointment_modal.dart';

class AgendaScreen extends StatefulWidget {
  const AgendaScreen({super.key});

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> {
  DateTime _selectedDate = DateTime.now();
  String _selectedEmployee = 'Tous';
  String _selectedStatus = 'Tous';
  late List<Appointment> _appointments;

  final List<String> _employees = [
    'Tous',
    'Yassine El Fassi',
    'Samira Bouzid',
    'Khalid Ait Lahcen',
    'Nadia El Khatib',
  ];

  final List<String> _statuses = ['Tous', 'Confirmé', 'En attente', 'Annulé'];

  @override
  void initState() {
    super.initState();
    _appointments = generateMockAppointments();
  }

  List<Appointment> get _filteredAppointments {
    final day = DateTime(_selectedDate.year, _selectedDate.month, _selectedDate.day);
    return _appointments.where((a) {
      final aDay = DateTime(a.date.year, a.date.month, a.date.day);
      if (aDay != day) return false;
      if (_selectedEmployee != 'Tous' && a.employee != _selectedEmployee) return false;
      if (_selectedStatus != 'Tous') {
        final statusMap = {
          'Confirmé': 'confirmed',
          'En attente': 'pending',
          'Annulé': 'cancelled',
        };
        if (a.status != statusMap[_selectedStatus]) return false;
      }
      return true;
    }).toList();
  }

  // Generate 7-day week strip starting from today - 3
  List<DateTime> get _weekDays {
    final anchor = DateTime.now().subtract(const Duration(days: 3));
    return List.generate(7, (i) => anchor.add(Duration(days: i)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () {},
        ),
        title: InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _selectedDate,
              firstDate: DateTime.now().subtract(const Duration(days: 365)),
              lastDate: DateTime.now().add(const Duration(days: 365)),
            );
            if (picked != null) {
              setState(() {
                _selectedDate = picked;
              });
            }
          },
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                DateFormat('E d MMM', 'fr_FR').format(_selectedDate),
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const Icon(Icons.keyboard_arrow_down, size: 18),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_view_day_outlined),
            onPressed: () {},
          ),
        ],
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0.5,
      ),
      body: Column(
        children: [
          // Subheader showing current collaborator
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFFAFAFA),
              border: Border(bottom: BorderSide(color: Color(0xFFEEEEEE))),
            ),
            child: Center(
              child: Text(
                _selectedEmployee == 'Tous' ? 'Tous les collaborateurs' : _selectedEmployee,
                style: GoogleFonts.outfit(
                  color: Colors.grey[700],
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          // Filter Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: _buildDropdown(
                    value: _selectedEmployee,
                    items: _employees,
                    icon: Icons.person_outline,
                    onChanged: (v) => setState(() => _selectedEmployee = v!),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildDropdown(
                    value: _selectedStatus,
                    items: _statuses,
                    icon: Icons.filter_list,
                    onChanged: (v) => setState(() => _selectedStatus = v!),
                  ),
                ),
              ],
            ),
          ),
          // Hour list + Timeline blocks
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 16, 16, 80),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Hour Indicator column (08:00 to 18:00)
                    Column(
                      children: List.generate(11, (index) {
                        final hour = 8 + index;
                        return Container(
                          height: 70,
                          alignment: Alignment.topCenter,
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(
                            '${hour.toString().padLeft(2, '0')}:00',
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: Colors.grey[500],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      }),
                    ),
                    // Vertical divider line
                    Container(
                      width: 1,
                      height: 770,
                      color: Colors.grey[200],
                    ),
                    const SizedBox(width: 8),
                    // Timeline block space
                    Expanded(
                      child: Container(
                        height: 770,
                        child: Stack(
                          children: [
                            // Hour grid lines
                            ...List.generate(11, (index) {
                              return Positioned(
                                top: index * 70.0,
                                left: 0,
                                right: 0,
                                child: Container(
                                  height: 1,
                                  color: Colors.grey[100],
                                ),
                              );
                            }),
                            // Appointments positioned inside the stack
                            ..._filteredAppointments.map((app) {
                              // Parse start time "09:00" to position
                              try {
                                final parts = app.time.split(':');
                                final hour = int.parse(parts[0]);
                                final minute = int.parse(parts[1]);
                                
                                // Calculate top offset based on 08:00 anchor
                                final double startMinutes = ((hour - 8) * 60.0) + minute;
                                if (startMinutes < 0 || startMinutes > 600) {
                                  return const SizedBox.shrink(); // Out of 8am to 6pm bounds
                                }
                                
                                final double top = (startMinutes / 60.0) * 70.0;
                                final double height = (app.duration / 60.0) * 70.0;
                                
                                // Background colors for timeline styling
                                Color blockColor = const Color(0xFF60A5FA);
                                if (app.service.contains('Coupe')) {
                                  blockColor = const Color(0xFF8B5CF6);
                                } else if (app.service.contains('Coloration')) {
                                  blockColor = const Color(0xFF14B8A6);
                                } else if (app.service.contains('Soin')) {
                                  blockColor = const Color(0xFFEC4899);
                                }
                                
                                return Positioned(
                                  top: top,
                                  left: 0,
                                  right: 0,
                                  height: height - 2, // minor padding
                                  child: GestureDetector(
                                    onTap: () {
                                      showModalBottomSheet(
                                        context: context,
                                        isScrollControlled: true,
                                        backgroundColor: Colors.transparent,
                                        builder: (_) => _AppointmentDetailsSheetWrapper(
                                          appointment: app,
                                          onStatusChanged: (status) {
                                            setState(() {
                                              final idx = _appointments.indexWhere((a) => a.id == app.id);
                                              if (idx != -1) {
                                                _appointments[idx] = _appointments[idx].copyWith(status: status);
                                              }
                                            });
                                          },
                                        ),
                                      );
                                    },
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: blockColor.withOpacity(0.85),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: blockColor),
                                      ),
                                      padding: const EdgeInsets.all(6),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Icon(
                                                Icons.person,
                                                size: 10,
                                                color: Colors.white.withOpacity(0.9),
                                              ),
                                              const SizedBox(width: 3),
                                              Expanded(
                                                child: Text(
                                                  '${app.time} - ${app.clientName}',
                                                  style: GoogleFonts.outfit(
                                                    color: Colors.white,
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            app.service,
                                            style: GoogleFonts.outfit(
                                              color: Colors.white.withOpacity(0.9),
                                              fontSize: 10,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              } catch (e) {
                                return const SizedBox.shrink();
                              }
                            }).toList(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openNewAppointmentModal,
        backgroundColor: const Color(0xFF10B981),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildDropdown({
    required String value,
    required List<String> items,
    required IconData icon,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.expand_more, size: 18),
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  void _openNewAppointmentModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => NewAppointmentModal(
        selectedDate: _selectedDate,
        onAdd: (appointment) {
          setState(() => _appointments.add(appointment));
        },
      ),
    );
  }
}

// Simple details sheet wrapper using existing appointment details UI structure
class _AppointmentDetailsSheetWrapper extends StatelessWidget {
  final Appointment appointment;
  final Function(String)? onStatusChanged;

  const _AppointmentDetailsSheetWrapper({
    required this.appointment,
    this.onStatusChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'Détails du rendez-vous',
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          _detailRow(Icons.person, 'Client', appointment.clientName),
          _detailRow(Icons.spa, 'Prestation', appointment.service),
          _detailRow(Icons.access_time, 'Heure', '${appointment.time} (${appointment.duration} min)'),
          _detailRow(Icons.badge, 'Collaborateur', appointment.employee),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    onStatusChanged?.call('confirmed');
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Confirmer'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Fermer'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF10B981)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey)),
              Text(value, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}
