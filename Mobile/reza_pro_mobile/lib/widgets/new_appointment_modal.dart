import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../models/appointment.dart';

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
  final _clientNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedService = 'Coupe femme';
  String _selectedEmployee = 'Samira Bouzid';
  String _selectedTime = '09:00';
  int _selectedDuration = 60;

  final List<String> _services = [
    'Coupe femme',
    'Coupe homme',
    'Brushing',
    'Coloration',
    'Mèches',
    'Manucure',
    'Soin du visage',
    'Massage relaxant',
    'Épilation',
    'Barbe + Coupe',
  ];

  final List<String> _employees = [
    'Yassine El Fassi',
    'Samira Bouzid',
    'Khalid Ait Lahcen',
    'Nadia El Khatib',
  ];

  final List<String> _times = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  final List<int> _durations = [15, 30, 45, 60, 75, 90, 120];

  int _nextId = 100;

  @override
  void dispose() {
    _clientNameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_clientNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Veuillez entrer le nom du client',
              style: GoogleFonts.outfit(fontSize: 13)),
          backgroundColor: AppColors.cancelled,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    final appointment = Appointment(
      id: _nextId++,
      clientName: _clientNameController.text.trim(),
      service: _selectedService,
      time: _selectedTime,
      duration: _selectedDuration,
      status: 'confirmed',
      employee: _selectedEmployee,
      phone: _phoneController.text.isNotEmpty ? _phoneController.text : null,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
      date: widget.selectedDate,
    );

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
        child: ListView(
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
            _textField(_clientNameController, 'Nom du client *', 'Ex: Yasmine Benali'),
            const SizedBox(height: 12),
            _textField(_phoneController, 'Téléphone', '+212 6 ...',
                type: TextInputType.phone),

            const SizedBox(height: 20),
            _sectionLabel('PRESTATION'),
            const SizedBox(height: 8),
            _dropdownField(
              'Service',
              _selectedService,
              _services,
              (v) => setState(() => _selectedService = v!),
            ),
            const SizedBox(height: 12),
            _durationPicker(),

            const SizedBox(height: 20),
            _sectionLabel('PLANIFICATION'),
            const SizedBox(height: 8),
            _timePicker(),
            const SizedBox(height: 12),
            _dropdownField(
              'Collaborateur',
              _selectedEmployee,
              _employees,
              (v) => setState(() => _selectedEmployee = v!),
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
                onPressed: _submit,
                icon: const Icon(Icons.check_rounded, size: 20),
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
    TextInputType type = TextInputType.text,
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
          keyboardType: type,
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

  Widget _dropdownField(
    String label,
    String value,
    List<String> items,
    ValueChanged<String?> onChanged,
  ) {
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
              value: value,
              isExpanded: true,
              icon: const Icon(Icons.expand_more_rounded,
                  size: 20, color: AppColors.textGray),
              style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textDark),
              items: items
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _durationPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Durée',
            style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textDark)),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _durations.map((d) {
              final selected = d == _selectedDuration;
              return GestureDetector(
                onTap: () => setState(() => _selectedDuration = d),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: selected ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Text(
                    d >= 60
                        ? '${d ~/ 60}h${d % 60 != 0 ? '${d % 60}m' : ''}'
                        : '${d}min',
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
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
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
