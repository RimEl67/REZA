import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../constants.dart';
import '../models/family_member.dart';
import '../viewmodels/auth_viewmodel.dart';
import '../services/account_service.dart';
import '../services/api_client.dart';
import '../services/booking_for_proche.dart';
import '../services/booking_service.dart';
import '../services/discovery_service.dart';
import '../widgets/group_participants_section.dart';
import 'booking_confirmation_screen.dart';
import 'login_screen.dart';

class BookingScreen extends StatefulWidget {
  final String tenantId;
  final VenueItem venue;
  final ServiceItem? preselectedService;
  /// Forwarded to BookingConfirmationScreen to navigate to Mes RDV tab.
  final VoidCallback? onGoToBookings;

  const BookingScreen({
    super.key,
    required this.tenantId,
    required this.venue,
    this.preselectedService,
    this.onGoToBookings,
  });

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  /// Solo: 0 option → 1 services → 2 date → 3 contact
  /// Group: 0 option → 1 services → 2 people → 3 date → 4 contact
  int _step = 0;
  bool _isGroupBooking = false;
  bool _includeBooker = true;
  final List<ServiceItem> _selectedServices = [];
  List<GuestParticipant> _participants = [];
  List<FamilyMember> _familyMembers = [];
  bool _familyLoading = false;

  DateTime? _selectedDate;
  String? _selectedTime;
  List<String> _timeSlots = [];
  bool _slotsLoading = false;
  bool _submitting = false;

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.preselectedService != null) {
      _selectedServices.add(widget.preselectedService!);
      _step = 1;
    }
    _selectedDate = DateTime.now();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final user = context.read<AuthViewModel>().user;
      if (user != null) {
        _emailController.text = user.email;
        _firstNameController.text = user.firstName;
        _lastNameController.text = user.lastName;
        _phoneController.text = user.phone ?? '';
      }
      await _applyBookingForProcheIntent();
      await _loadFamily();
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _applyBookingForProcheIntent() async {
    final pending = await peekBookingForProche();
    if (pending == null || pending.id.isEmpty) return;
    setState(() {
      _isGroupBooking = true;
      _includeBooker = false;
      _participants = [
        GuestParticipant(
          id: 'family-${pending.id}',
          familyMemberId: pending.id,
          name: pending.name,
        ),
      ];
      if (_step == 0) _step = 1;
    });
  }

  Future<void> _loadFamily() async {
    final auth = context.read<AuthViewModel>();
    if (!auth.isAuthenticated || auth.email == null) {
      setState(() {
        _familyMembers = [];
        _familyLoading = false;
      });
      return;
    }
    setState(() => _familyLoading = true);
    try {
      final list = await accountService.getFamilyMembers(auth.email!);
      if (!mounted) return;
      setState(() {
        _familyMembers = list;
        _familyLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _familyMembers = [];
        _familyLoading = false;
      });
    }
  }

  List<DateTime> get _nextDays => List.generate(14, (i) => DateTime.now().add(Duration(days: i)));

  String _dayAbbr(DateTime d) {
    const days = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
    return days[d.weekday - 1];
  }

  String _monthAbbr(DateTime d) {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[d.month - 1];
  }

  String _formatFullDate(DateTime d) {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return '${days[d.weekday - 1]} ${d.day} ${months[d.month - 1]}';
  }

  String _dateApi(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  double get _templateTotal => _selectedServices.fold(0, (sum, s) => sum + s.price);
  int get _totalDuration => _selectedServices.fold(0, (sum, s) => sum + s.durationMin);

  double _guestSubtotal(GuestParticipant p) {
    if (p.sameServicesAsBooker) return _templateTotal;
    return widget.venue.services
        .where((s) => p.serviceIds.contains(s.id) || p.serviceIds.contains(s.name))
        .fold(0.0, (sum, s) => sum + s.price);
  }

  double get _groupGrandTotal {
    if (!_isGroupBooking) return _templateTotal;
    return (_includeBooker ? _templateTotal : 0) +
        _participants.fold(0.0, (sum, p) => sum + _guestSubtotal(p));
  }

  String get _durationLabel {
    final h = _totalDuration ~/ 60;
    final m = _totalDuration % 60;
    if (h > 0 && m > 0) return '$h h $m min';
    if (h > 0) return '$h h';
    return '$m min';
  }

  int get _displayPrice => _groupGrandTotal.toInt();

  Future<void> _loadSlots() async {
    if (_selectedDate == null || _selectedServices.isEmpty) return;
    final ids = _selectedServices.map((s) => s.id).where((id) => id.isNotEmpty).toList();
    if (ids.isEmpty) {
      setState(() => _timeSlots = []);
      return;
    }
    setState(() {
      _slotsLoading = true;
      _selectedTime = null;
    });
    try {
      final slots = await discoveryService.getAvailableSlots(
        tenantId: widget.tenantId,
        date: _dateApi(_selectedDate!),
        serviceIds: ids,
      );
      if (!mounted) return;
      setState(() {
        _timeSlots = slots;
        _slotsLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _timeSlots = [];
        _slotsLoading = false;
      });
    }
  }

  void _goBack() {
    if (_step > 0) {
      setState(() => _step--);
    } else {
      Navigator.pop(context);
    }
  }

  void _continueFromServices() {
    if (_isGroupBooking) {
      setState(() => _step = 2);
    } else {
      setState(() => _step = 2);
      _loadSlots();
    }
  }

  void _continueFromPeople() {
    if (!_includeBooker && _participants.isEmpty) {
      _showError('Sélectionnez au moins Moi ou un proche / invité');
      return;
    }
    final empty = _participants.where((p) => p.name.trim().isEmpty).toList();
    if (empty.isNotEmpty) {
      _showError('Indiquez le nom de chaque invité');
      return;
    }
    setState(() => _step = 3);
    _loadSlots();
  }

  void _continueFromDate() {
    final auth = context.read<AuthViewModel>();
    final user = auth.user;
    final hasPhone = user?.phone != null && user!.phone!.isNotEmpty;
    final contactStep = _isGroupBooking ? 4 : 3;
    if (!auth.isAuthenticated || !hasPhone) {
      setState(() => _step = contactStep);
    } else {
      _submitBooking();
    }
  }

  Future<void> _submitBooking() async {
    if (_submitting) return;
    final auth = context.read<AuthViewModel>();
    final user = auth.user;

    final firstName = (user?.firstName.isNotEmpty == true)
        ? user!.firstName
        : _firstNameController.text.trim();
    final lastName = (user?.lastName.isNotEmpty == true)
        ? user!.lastName
        : _lastNameController.text.trim();
    final phone = (user?.phone != null && user!.phone!.isNotEmpty)
        ? user.phone!
        : _phoneController.text.trim();
    final email = user?.email ?? _emailController.text.trim();

    if (firstName.isEmpty || lastName.isEmpty || phone.isEmpty) {
      _showError('Prénom, nom et téléphone requis');
      setState(() => _step = _isGroupBooking ? 4 : 3);
      return;
    }
    if (_selectedDate == null || _selectedTime == null) {
      _showError('Choisissez une date et une heure');
      return;
    }

    if (_isGroupBooking) {
      if (!_includeBooker && _participants.isEmpty) {
        _showError('Sélectionnez au moins une personne');
        setState(() => _step = 2);
        return;
      }
      if (_participants.any((p) => p.name.trim().isEmpty)) {
        _showError('Nom requis pour chaque invité');
        setState(() => _step = 2);
        return;
      }
    }

    final serviceIds = _selectedServices.map((s) => s.id).where((id) => id.isNotEmpty).toList();
    if (serviceIds.isEmpty) {
      _showError('Services invalides (ids manquants)');
      return;
    }

    final parts = _selectedTime!.split(':');
    final hour = int.tryParse(parts[0]) ?? 0;
    final minute = parts.length > 1 ? int.tryParse(parts[1]) ?? 0 : 0;
    final startLocal = DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      hour,
      minute,
    );

    List<Map<String, dynamic>>? participants;
    var includeBooker = true;
    if (_isGroupBooking) {
      includeBooker = _includeBooker;
      participants = _participants
          .map((p) => {
                'name': p.name.trim(),
                'sameServicesAsBooker': p.sameServicesAsBooker,
                if (!p.sameServicesAsBooker)
                  'serviceIds': p.serviceIds.where((id) => id.isNotEmpty).toList(),
              })
          .toList();
    }

    setState(() => _submitting = true);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
    );

    try {
      final result = await bookingService.createBooking(
        tenantId: widget.tenantId,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email.isNotEmpty ? email : null,
        serviceIds: serviceIds,
        startTimeIso: startLocal.toUtc().toIso8601String(),
        includeBooker: includeBooker,
        participants: participants,
      );
      await clearBookingForProche();
      if (!mounted) return;
      Navigator.pop(context);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookingConfirmationScreen(
            venue: widget.venue,
            service: _selectedServices.first,
            date: _formatFullDate(_selectedDate!),
            time: _selectedTime!,
            bookingResult: result,
            onGoToBookings: widget.onGoToBookings,
          ),
        ),
      );
    } on ApiException catch (e) {
      if (mounted) {
        Navigator.pop(context);
        _showError(e.message);
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        _showError(e.toString());
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.inter(fontSize: 13)),
        backgroundColor: AppColors.textDark,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Widget _stepBody() {
    if (_step == 0) return _buildOptionStep();
    if (_step == 1) return _buildServicesStep();
    if (_isGroupBooking) {
      if (_step == 2) return _buildPeopleStep();
      if (_step == 3) return _buildDateTimeStep();
      return _buildGuestStep();
    }
    if (_step == 2) return _buildDateTimeStep();
    return _buildGuestStep();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: child),
                child: KeyedSubtree(
                  key: ValueKey('${_isGroupBooking}_$_step'),
                  child: _stepBody(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      child: Row(
        children: [
          IconButton(icon: const Icon(Icons.arrow_back, color: AppColors.textDark, size: 22), onPressed: _goBack),
          const Spacer(),
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.textDark, size: 22),
            onPressed: () async {
              await clearBookingForProche();
              if (mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildOptionStep() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Sélectionnez une option', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textDark)),
          const SizedBox(height: 28),
          _OptionCard(
            title: 'Prenez un rendez-vous',
            subtitle: 'Programmez des prestations pour vous',
            icon: Icons.person_outline_rounded,
            onTap: () => setState(() {
              _isGroupBooking = false;
              _includeBooker = true;
              _participants = [];
              _step = 1;
            }),
          ),
          const SizedBox(height: 12),
          _OptionCard(
            title: 'Prendre un rendez-vous de groupe',
            subtitle: 'Pour vous-même et/ou pour les autres',
            icon: Icons.groups_outlined,
            onTap: () => setState(() {
              _isGroupBooking = true;
              _step = 1;
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
          child: Text(
            _isGroupBooking ? 'Prestations\n(modèle partagé)' : 'Sélectionnez les\nprestations',
            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textDark),
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
            itemCount: widget.venue.services.length,
            itemBuilder: (context, index) {
              final service = widget.venue.services[index];
              final isAdded = _selectedServices.any((s) =>
                  (service.id.isNotEmpty && s.id == service.id) || s.name == service.name);
              return _ServiceCard(
                service: service,
                isAdded: isAdded,
                onToggle: () {
                  setState(() {
                    if (isAdded) {
                      _selectedServices.removeWhere((s) =>
                          (service.id.isNotEmpty && s.id == service.id) || s.name == service.name);
                    } else {
                      _selectedServices.add(service);
                    }
                  });
                },
              );
            },
          ),
        ),
        if (_selectedServices.isNotEmpty) _bottomBar(
          priceLabel: '${_templateTotal.toInt()} MAD',
          subtitle: '${_selectedServices.length} article${_selectedServices.length > 1 ? 's' : ''} · $_durationLabel',
          onContinue: _continueFromServices,
        ),
      ],
    );
  }

  Widget _buildPeopleStep() {
    final auth = context.watch<AuthViewModel>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Text(
            'Pour qui\nréservez-vous ?',
            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textDark),
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
            children: [
              GroupParticipantsSection(
                participants: _participants,
                onChanged: (list) => setState(() => _participants = list),
                includeBooker: _includeBooker,
                onIncludeBookerChange: (v) => setState(() => _includeBooker = v),
                bookerTotal: _templateTotal,
                allServices: widget.venue.services,
                familyMembers: _familyMembers,
                familyLoading: _familyLoading,
                isAuthenticated: auth.isAuthenticated,
                onLoginTap: () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
                  await _loadFamily();
                },
              ),
            ],
          ),
        ),
        _bottomBar(
          priceLabel: '${_displayPrice} MAD',
          subtitle: _includeBooker || _participants.isNotEmpty
              ? 'Total groupe'
              : 'Sélectionnez des personnes',
          onContinue: (_includeBooker || _participants.isNotEmpty) ? _continueFromPeople : null,
        ),
      ],
    );
  }

  Widget _buildDateTimeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
          child: Text("Sélectionnez la date et\nl'heure", style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textDark)),
        ),
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text('Sélectionner une date', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textDark)),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 82,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _nextDays.length,
            itemBuilder: (context, index) {
              final date = _nextDays[index];
              final isSelected = _selectedDate?.day == date.day &&
                  _selectedDate?.month == date.month &&
                  _selectedDate?.year == date.year;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDate = date;
                    _selectedTime = null;
                  });
                  _loadSlots();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  margin: const EdgeInsets.only(right: 10),
                  width: 60,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.purpleAccent : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isSelected ? AppColors.purpleAccent : AppColors.border),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_dayAbbr(date), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: isSelected ? Colors.white70 : AppColors.textGray)),
                      Text('${date.day}', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: isSelected ? Colors.white : AppColors.textDark)),
                      Text(_monthAbbr(date), style: GoogleFonts.inter(fontSize: 10, color: isSelected ? Colors.white70 : AppColors.textGray)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text('Choisissez une heure', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textDark)),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: _slotsLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : _timeSlots.isEmpty
                  ? Center(child: Text('Aucun créneau disponible', style: GoogleFonts.inter(color: AppColors.textGray)))
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                      itemCount: _timeSlots.length,
                      itemBuilder: (context, index) {
                        final time = _timeSlots[index];
                        final isSelected = _selectedTime == time;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedTime = time),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: isSelected ? AppColors.purpleAccent : AppColors.border, width: isSelected ? 2 : 1),
                            ),
                            child: Text(time, style: GoogleFonts.inter(fontSize: 15, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400, color: isSelected ? AppColors.purpleAccent : AppColors.textDark)),
                          ),
                        );
                      },
                    ),
        ),
        _bottomBar(
          priceLabel: '${_displayPrice} MAD',
          subtitle: null,
          onContinue: _selectedTime != null ? _continueFromDate : null,
        ),
      ],
    );
  }

  Widget _buildGuestStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Vos informations', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textDark)),
          const SizedBox(height: 8),
          Text(
            _isGroupBooking && !_includeBooker
                ? 'Contact pour la réservation (vous n’êtes pas dans le RDV).'
                : 'Nécessaire pour confirmer la réservation.',
            style: GoogleFonts.inter(fontSize: 14, color: AppColors.textGray),
          ),
          const SizedBox(height: 24),
          _field('Prénom', _firstNameController),
          const SizedBox(height: 12),
          _field('Nom', _lastNameController),
          const SizedBox(height: 12),
          _field('Téléphone', _phoneController, keyboard: TextInputType.phone),
          const SizedBox(height: 12),
          _field('Email', _emailController, keyboard: TextInputType.emailAddress),
          if (_isGroupBooking) ...[
            const SizedBox(height: 16),
            Text(
              'Total à payer sur place : ${_displayPrice} MAD',
              style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _submitting ? null : _submitBooking,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text('Confirmer la réservation', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bottomBar({
    required String priceLabel,
    String? subtitle,
    VoidCallback? onContinue,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -4))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(priceLabel, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textDark)),
                if (subtitle != null)
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textGray)),
              ],
            ),
          ),
          GestureDetector(
            onTap: onContinue,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              decoration: BoxDecoration(
                color: onContinue != null ? AppColors.primary : AppColors.border,
                borderRadius: BorderRadius.circular(28),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Continuez',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: onContinue != null ? Colors.white : AppColors.textGray,
                    ),
                  ),
                  if (onContinue != null) ...[
                    const SizedBox(width: 6),
                    const Icon(Icons.arrow_forward, color: Colors.white, size: 18),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController c, {TextInputType? keyboard}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textDark)),
        const SizedBox(height: 8),
        TextField(
          controller: c,
          keyboardType: keyboard,
          style: GoogleFonts.inter(fontSize: 15, color: AppColors.textDark),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}

class _OptionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  const _OptionCard({required this.title, required this.subtitle, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
                ],
              ),
            ),
            Icon(icon, size: 28, color: AppColors.textDark),
          ],
        ),
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final ServiceItem service;
  final bool isAdded;
  final VoidCallback onToggle;

  const _ServiceCard({required this.service, required this.isAdded, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    final durationLabel = service.durationMin >= 60
        ? '${service.durationMin ~/ 60} h${service.durationMin % 60 > 0 ? ' ${service.durationMin % 60} min' : ''}'
        : '${service.durationMin} min';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isAdded ? AppColors.primary : AppColors.border, width: isAdded ? 1.5 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(service.name.toUpperCase(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark, letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Text(durationLabel, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray)),
          if (service.description.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(service.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textGray, height: 1.4)),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${service.price.toInt()} MAD', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark)),
              GestureDetector(
                onTap: onToggle,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isAdded ? AppColors.primary : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(color: isAdded ? AppColors.primary : AppColors.border),
                  ),
                  child: Icon(isAdded ? Icons.check : Icons.add, size: 20, color: isAdded ? Colors.white : AppColors.textDark),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
