'use client';

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Tag, Image as ImageIcon, Check, Loader2, X, Plus, Instagram, Facebook, Twitter, Phone, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const InformationsLandingPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Tenant fields
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [shortDescription, setShortDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Settings fields
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [socialMedia, setSocialMedia] = useState({
    instagram: '',
    facebook: '',
    twitter: ''
  });
  const [featured, setFeatured] = useState(false);
  
  // Display controls
  const [showMap, setShowMap] = useState(true);
  const [showOpeningHours, setShowOpeningHours] = useState(true);
  const [showOnlineReservation, setShowOnlineReservation] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [onlineReservationEnabled, setOnlineReservationEnabled] = useState(true);

  const categories = [
    'Coiffeur',
    'Barbier',
    'Manucure',
    'Institut de beauté',
    'Spa',
    'Massage',
    'Établissement'
  ];

  const moroccanCities = [
    'Agadir',
    'Beni Mellal',
    'Casablanca',
    'El Jadida',
    'Fès',
    'Kenitra',
    'Khouribga',
    'Marrakech',
    'Meknès',
    'Mohammedia',
    'Oujda',
    'Rabat',
    'Safi',
    'Salé',
    'Tanger',
    'Tétouan',
    'Autre'
  ];

  const commonAmenities = [
    'WiFi gratuit',
    'Climatisation',
    'Parking',
    'Accessible PMR',
    'Cabine privée',
    'Douche',
    'Hammam',
    'Sauna',
    'Jacuzzi',
    'Terrasse'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantRes, settingsRes] = await Promise.all([
        api.getTenant(),
        api.getTenantSettings()
      ]);

      const tenant = tenantRes.tenant;
      const settings = settingsRes.settings;

      // Set tenant fields
      setCategory(tenant.category || '');
      // Set cover image - if it's a local path, prepend the API base URL
      const coverImageUrl = tenant.coverImage 
        ? (tenant.coverImage.startsWith('http') 
            ? tenant.coverImage 
            : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${tenant.coverImage}`)
        : '';
      setCoverImage(coverImageUrl);
      setShortDescription(tenant.shortDescription || '');
      setWebsite(tenant.website || '');
      setPhone(tenant.phone || '');
      setEmail(tenant.email || '');
      setCity(tenant.city || '');
      setGoogleMapsLink(tenant.googleMapsLink || '');
      setLatitude(tenant.latitude?.toString() || '');
      setLongitude(tenant.longitude?.toString() || '');
      setTags(tenant.tags || []);

      // Set settings fields
      setAmenities((settings.amenities as string[]) || []);
      setSocialMedia((settings.socialMedia as any) || { instagram: '', facebook: '', twitter: '' });
      setFeatured(settings.featured || false);
      
      // Set display controls
      setShowMap(settings.showMap !== false);
      setShowOpeningHours(settings.showOpeningHours !== false);
      setShowOnlineReservation(settings.showOnlineReservation !== false);
      setShowReviews(settings.showReviews !== false);
      setOnlineReservationEnabled(settings.onlineReservationEnabled !== false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast.error(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);
      const loadingToast = toast.loading('Enregistrement des informations...');

      // Update tenant
      await api.updateTenant({
        category: category || undefined,
        coverImage: coverImage || undefined,
        shortDescription: shortDescription || undefined,
        website: website || undefined,
        phone: phone || undefined,
        email: email || undefined,
        city: city || undefined,
        googleMapsLink: googleMapsLink || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        tags: tags.length > 0 ? tags : undefined
      });

      // Update settings
      await api.updateTenantSettings({
        amenities: amenities.length > 0 ? amenities : undefined,
        socialMedia: Object.values(socialMedia).some(v => v) ? socialMedia : undefined,
        featured,
        showMap,
        showOpeningHours,
        showOnlineReservation,
        showReviews,
        onlineReservationEnabled
      });

      toast.dismiss(loadingToast);
      toast.success('Informations enregistrées avec succès');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving data:', err);
      toast.error(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addAmenity = (amenity: string) => {
    if (!amenities.includes(amenity)) {
      setAmenities([...amenities, amenity]);
    }
  };

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity));
  };

  const addCustomAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-0 md:p-0 max-w-[2000px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#002366] w-8 h-8" />
          <span className="ml-3 text-gray-600">Chargement des informations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-0 md:p-0 max-w-[2000px] mx-auto">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-6 right-6 bg-green-400 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-3 animate-fadeIn">
          <Check size={20} />
          <span className="font-medium">Modifications enregistrées avec succès</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 animate-slideUp mt-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 tracking-tight mb-2">
              Informations Landing Page
            </h1>
            <p className="text-sm text-gray-500">
              Gérez les informations affichées sur votre page publique Reza
            </p>
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <div className="space-y-6 animate-fadeIn">
        {/* Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie principale *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Short Description */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description courte (pour les cartes de recherche)
          </label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366] text-sm text-gray-700 resize-none"
            placeholder="Une description courte qui apparaîtra dans les résultats de recherche..."
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {shortDescription.length}/200 caractères
          </div>
        </div>

        {/* Cover Image */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image de couverture
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverImageFile(file);
                    setUploadingImage(true);
                    try {
                      const result = await api.uploadCoverImage(file);
                      // Prepend API base URL if it's a local path
                      const imageUrl = result.coverImage.startsWith('http') 
                        ? result.coverImage 
                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${result.coverImage}`;
                      setCoverImage(imageUrl);
                      toast.success('Image uploadée avec succès');
                    } catch (err: any) {
                      console.error('Error uploading image:', err);
                      toast.error(err.message || 'Erreur lors de l\'upload de l\'image');
                      setCoverImageFile(null);
                    } finally {
                      setUploadingImage(false);
                    }
                  }
                }}
                disabled={uploadingImage}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#002366] file:text-white hover:file:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {uploadingImage && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Upload en cours...</span>
              </div>
            )}
            {coverImage && !uploadingImage && (
              <div className="mt-3">
                <img 
                  src={coverImage.startsWith('http') ? coverImage : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${coverImage}`} 
                  alt="Cover preview" 
                  className="max-w-full h-48 object-cover rounded-lg border border-gray-200" 
                />
                <button
                  onClick={() => {
                    setCoverImage('');
                    setCoverImageFile(null);
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Supprimer l'image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Website */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site web
          </label>
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone
          </label>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+212 6XX XXX XXX"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@example.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
            />
          </div>
        </div>

        {/* City */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville
          </label>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
            >
              <option value="">Sélectionner une ville</option>
              {moroccanCities.map(cityName => (
                <option key={cityName} value={cityName}>{cityName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Google Maps Link */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lien Google Maps
          </label>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={googleMapsLink}
              onChange={(e) => setGoogleMapsLink(e.target.value)}
              placeholder="https://maps.google.com/?q=..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Copiez le lien de partage depuis Google Maps pour permettre aux clients de vous localiser facilement
          </p>
        </div>

        {/* Coordinates */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Coordonnées GPS (pour la carte)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="33.5731"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-7.6298"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366] text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (pour la recherche)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Ajouter un tag"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-[#002366] text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  <Tag size={14} />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Équipements et services
          </label>
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                placeholder="Ajouter un équipement personnalisé"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
              />
              <button
                onClick={addCustomAmenity}
                className="px-4 py-2 bg-[#002366] text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-2">Équipements courants :</div>
            <div className="flex flex-wrap gap-2">
              {commonAmenities.map(amenity => (
                <button
                  key={amenity}
                  onClick={() => amenities.includes(amenity) ? removeAmenity(amenity) : addAmenity(amenity)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    amenities.includes(amenity)
                      ? 'bg-[#002366] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amenities.includes(amenity) && <Check size={14} className="inline mr-1" />}
                  {amenity}
                </button>
              ))}
            </div>
          </div>
          {amenities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Équipements sélectionnés :</div>
              <div className="flex flex-wrap gap-2">
                {amenities.map(amenity => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {amenity}
                    <button
                      onClick={() => removeAmenity(amenity)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Réseaux sociaux
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Instagram className="w-5 h-5 text-pink-500" />
              <input
                type="url"
                value={socialMedia.instagram}
                onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                placeholder="https://instagram.com/votre-compte"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Facebook className="w-5 h-5 text-blue-600" />
              <input
                type="url"
                value={socialMedia.facebook}
                onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                placeholder="https://facebook.com/votre-page"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Twitter className="w-5 h-5 text-blue-400" />
              <input
                type="url"
                value={socialMedia.twitter}
                onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                placeholder="https://twitter.com/votre-compte"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002366]/20 focus:border-[#002366]"
              />
            </div>
          </div>
        </div>

        {/* Display Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contrôles d'affichage</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showMap}
                onChange={(e) => setShowMap(e.target.checked)}
                className="w-5 h-5 text-[#002366] border-gray-300 rounded focus:ring-[#002366]"
              />
              <span className="text-sm font-medium text-gray-700">
                Afficher la carte
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-8">
              Affiche la carte avec votre localisation sur la page publique
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOpeningHours}
                onChange={(e) => setShowOpeningHours(e.target.checked)}
                className="w-5 h-5 text-[#002366] border-gray-300 rounded focus:ring-[#002366]"
              />
              <span className="text-sm font-medium text-gray-700">
                Afficher les horaires d'ouverture
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-8">
              Affiche les horaires d'ouverture sur la page publique
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlineReservation}
                onChange={(e) => setShowOnlineReservation(e.target.checked)}
                className="w-5 h-5 text-[#002366] border-gray-300 rounded focus:ring-[#002366]"
              />
              <span className="text-sm font-medium text-gray-700">
                Afficher le bouton de réservation en ligne
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-8">
              Affiche le bouton "Réserver maintenant" sur la page publique
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showReviews}
                onChange={(e) => setShowReviews(e.target.checked)}
                className="w-5 h-5 text-[#002366] border-gray-300 rounded focus:ring-[#002366]"
              />
              <span className="text-sm font-medium text-gray-700">
                Afficher les avis clients
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-8">
              Affiche la section des avis clients sur la page publique
            </p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlineReservationEnabled}
                onChange={(e) => setOnlineReservationEnabled(e.target.checked)}
                className="w-5 h-5 text-[#002366] border-gray-300 rounded focus:ring-[#002366]"
              />
              <span className="text-sm font-medium text-gray-700">
                Activer la réservation en ligne
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-8">
              Permet aux clients de réserver en ligne via votre page publique
            </p>
          </div>
        </div>

        {/* Featured */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 text-[#002366] border-gray-300 rounded focus:ring-[#002366]"
            />
            <span className="text-sm font-medium text-gray-700">
              Mettre en avant sur la landing page
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-2 ml-8">
            Si activé, votre établissement sera mis en avant sur la page d'accueil Reza
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#002366] hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-full transition-colors uppercase text-sm tracking-wide flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              Enregistrement...
            </>
          ) : (
            'SAUVEGARDER'
          )}
        </button>
      </div>
    </div>
  );
};

export default InformationsLandingPage;

