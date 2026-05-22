import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Switch,
  Modal
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Papa, { ParseResult } from 'papaparse';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { ReviewModal as SupportModal } from './ReviewModal';

import PaystackWebViewComponent from 'react-native-paystack-webview';
const PaystackWebView = PaystackWebViewComponent as any;

interface InventoryUploadRow {
  Brand: string;
  Model: string;
  Category: string;
  Variant: string;
  Price: string;
  Quantity: string;
}

interface ParsedInventoryItem {
  brand: string;
  model: string;
  category: string;
  variantName: string;
  price: number;
  stock: number;
}

interface AuditLogEntry {
  timestamp: number;
  type: string;
  productName?: string;
  variantName?: string;
  quantity?: number;
  price?: number;
  discount?: number;
}

export default function Settings() {
  const { user, profile, logout, updateProfile, reauthenticate } = useAuth() as any;
  const { auditLog, bulkInventoryUpload } = useInventory() as any;

  const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = now.toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });

  const [showBulkUploadGate, setShowBulkUploadGate] = useState(false);
  const [bulkPin, setBulkPin] = useState('');
  const [showBulkScanner, setShowBulkScanner] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedInventoryItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [replaceEntire, setReplaceEntire] = useState(false);

  const [profileForm, setProfileForm] = useState({
    businessName: '',
    businessAddress: '',
    businessPhone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityStep, setSecurityStep] = useState<'password' | 'pin'>('password');
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [triggerPaystack, setTriggerPaystack] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        businessName: profile.businessName || '',
        businessAddress: profile.businessAddress || '',
        businessPhone: profile.businessPhone || '',
      });
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!profileForm.businessName.trim()) {
      Alert.alert('Validation Error', 'Business Name tracking parameter is required.');
      return;
    }
    if (typeof updateProfile !== 'function') {
      Alert.alert('Configuration Error', 'Profile update channel is currently unlinked.');
      return;
    }
    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileForm);
      Alert.alert('Success', 'Business configuration properties written cleanly.');
    } catch (err) {
      Alert.alert('Error', 'Failed to update remote profile properties.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleReauth = async () => {
    if (!password.trim()) return;
    if (typeof reauthenticate !== 'function') {
      Alert.alert('Configuration Error', 'Reauthentication logic wrapper is missing.');
      return;
    }
    setSecLoading(true);
    try {
      await reauthenticate(password);
      setSecurityStep('pin');
    } catch (err) {
      Alert.alert('Security Alert', 'Invalid credentials profile signature confirmation.');
    } finally {
      setSecLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Warning', 'PIN MUST BE EXACTLY 4 DIGITS');
      return;
    }
    if (typeof updateProfile !== 'function') {
      Alert.alert('Configuration Error', 'Profile link layer missing.');
      return;
    }
    setSecLoading(true);
    try {
      await updateProfile({ adminPin: newPin });
      Alert.alert('Success', 'Administrative security override PIN committed.');
      setShowSecurityModal(false);
      setSecurityStep('password');
      setPassword('');
      setNewPin('');
    } catch (err) {
      Alert.alert('Error', 'Unable to execute security state write.');
    } finally {
      setSecLoading(false);
    }
  };

  const handleBulkPinSubmit = () => {
    if (bulkPin === profile?.adminPin) {
      setShowBulkUploadGate(false);
      setBulkPin('');
      setShowBulkScanner(true);
    } else {
      Alert.alert('Access Denied', 'INVALID STRUCTURAL ADMINISTRATIVE PIN CODE');
      setBulkPin('');
    }
  };

  const commitSubscriptionExtension = async () => {
    if (!profile) return;
    if (typeof updateProfile !== 'function') {
      Alert.alert('Configuration Error', 'Profile update action unlinked.');
      return;
    }
    setIsUpdatingProfile(true);
    const nowMs = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const currentExpiry = profile.accessExpiresAt || nowMs;
    const newExpiry = nowMs < currentExpiry ? currentExpiry + thirtyDays : nowMs + thirtyDays;

    try {
      await updateProfile({ accessExpiresAt: newExpiry, isPaid: true });
      Alert.alert('Subscription Renewed', 'Mobile node license expanded gracefully (+30 Days).');
    } catch (e) {
      Alert.alert('Sync Loop Error', 'Could not sync subscription database bounds.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const getWorkingDir = () => {
    const fsModule = FileSystem as any;
    return fsModule.cacheDirectory || fsModule.CacheDirectory || fsModule.documentDirectory || '';
  };

  const downloadCSVTemplate = async () => {
    try {
      const csvContent = "Brand,Model,Category,Variant,Price,Quantity\nRedmi,Note 13,Phone,8GB/256GB - Blue,195000,8\nApple,iPhone 15 Pro,Phone,256GB - Blue Titanium,1550000,5";
      const baseDir = getWorkingDir();
      const fileUri = `${baseDir}NaijaInventory_Template.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { 
        encoding: 'utf8' as any 
      });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert('System Error', 'Cannot extract temporary asset templates.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsParsing(true);
        const pickedFile = result.assets[0];
        const fileContent = await FileSystem.readAsStringAsync(pickedFile.uri, { encoding: 'utf8' as any });
        
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results: ParseResult<InventoryUploadRow>) => {
            const headers = results.meta.fields || [];
            const required = ['Brand', 'Model', 'Category', 'Variant', 'Price', 'Quantity'];
            const isValid = required.every(h => headers.includes(h));

            if (!isValid) {
              Alert.alert('Layout Parsing Error', 'CSV data schema is missing expected column configurations.');
              setIsParsing(false);
              return;
            }

            const items: ParsedInventoryItem[] = results.data.map((row: InventoryUploadRow) => ({
              brand: (row.Brand || '').toString().trim(),
              model: (row.Model || '').toString().trim(),
              category: (row.Category || '').toString().trim(),
              variantName: (row.Variant || '').toString().trim(),
              price: Number((row.Price || '0').toString().replace(/[₦, \s]/g, '')),
              stock: Number((row.Quantity || '0').toString().replace(/[₦, \s]/g, ''))
            })).filter((i: ParsedInventoryItem) => i.brand && i.model);

            if (items.length === 0) {
              Alert.alert('Empty Payload', 'No matching inventory rows identified inside dataset streams.');
              setIsParsing(false);
              return;
            }

            setParsedItems(items);
            setIsParsing(false);
            Alert.alert('Staged Successfully', `${items.length} structures parsed from target source package data.`);
          },
          error: () => {
            Alert.alert('Corruption Detected', 'File content parsing stream encountered a severe lock.');
            setIsParsing(false);
          }
        });
      }
    } catch (err) {
      Alert.alert('Picker Error', 'Unable to resolve targeted directory folder path parameters.');
    }
  };

  const executeUpload = async () => {
    if (typeof bulkInventoryUpload !== 'function') {
      Alert.alert('Configuration Error', 'Bulk integration pipeline is missing from InventoryContext.');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await bulkInventoryUpload(parsedItems, replaceEntire, (progress: number) => {
        setUploadProgress(progress);
      });
      Alert.alert('Deployment Success', 'Distributed stock updates written safely onto cloud arrays.');
      setShowBulkScanner(false);
      setParsedItems([]);
      setReplaceEntire(false);
    } catch (err) {
      Alert.alert('Upload Aborted', 'Database layer transaction error occurred during transmission.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const exportToCSV = async () => {
    if (!auditLog || auditLog.length === 0) {
      Alert.alert('Empty Dataset', 'No structural logs available inside the local inventory application footprint.');
      return;
    }
    setIsExporting(true);
    try {
      const startMs = new Date(dateRange.start).setHours(0, 0, 0, 0);
      const endMs = new Date(dateRange.end).setHours(23, 59, 59, 999);

      const filteredLogs = auditLog.filter((log: AuditLogEntry) => log.timestamp >= startMs && log.timestamp <= endMs);

      if (filteredLogs.length === 0) {
        Alert.alert('Empty Bounds', 'No transactions found within selected tracking timeline dates.');
        setIsExporting(false);
        return;
      }

      const headers = ['Date', 'Action', 'Item', 'Variant', 'Quantity', 'Price Sold For (₦)', 'Discount (₦)', 'Surplus (₦)'];
      const rows = filteredLogs.map((log: AuditLogEntry) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        const price = log.price || 0;
        const discount = log.discount && log.discount > 0 ? log.discount : 0;
        const surplus = log.discount && log.discount < 0 ? Math.abs(log.discount) : 0;

        return [
          date,
          log.type,
          `"${(log.productName || '').replace(/"/g, '""')}"`,
          `"${(log.variantName || '').replace(/"/g, '""')}"`,
          log.quantity || 0,
          price,
          discount,
          surplus
        ];
      });

      const totalSales = filteredLogs.reduce((acc: number, r: AuditLogEntry) => acc + (r.price || 0), 0);
      const totalDiscounts = filteredLogs.reduce((acc: number, r: AuditLogEntry) => acc + (r.discount && r.discount > 0 ? r.discount : 0), 0);
      const totalSurplus = filteredLogs.reduce((acc: number, r: AuditLogEntry) => acc + (r.discount && r.discount < 0 ? Math.abs(r.discount) : 0), 0);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: (string | number)[]) => row.join(',')),
        ['', '', '', '', 'TOTAL', totalSales, totalDiscounts, totalSurplus].join(',')
      ].join('\n');

      const baseCachePath = getWorkingDir(); 
      const fileUri = `${baseCachePath}Audit_Statement_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' as any });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert('Storage Restriction', 'The system rejected local temporary serialization procedures.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black p-6" contentContainerStyle={{ paddingBottom: 100 }}>
      {triggerPaystack && (
        <PaystackWebView
          paystackKey={PAYSTACK_PUBLIC_KEY}
          amount={15000 * 100}
          billingEmail={user?.email || 'billing@naijainventory.pro'}
          activityIndicatorColor="#10b981"
          onCancel={() => {
            setTriggerPaystack(false);
            Alert.alert('Payment Cancelled', 'Subscription renewal window dismissed.');
          }}
          onSuccess={() => {
            setTriggerPaystack(false);
            commitSubscriptionExtension();
          }}
          autoStart={true}
        />
      )}

      <View className="mb-8 mt-4">
        <Text className="text-4xl font-black text-white uppercase tracking-tighter">Settings</Text>
        <Text className="text-zinc-500 text-xs font-mono uppercase mt-1">Preferences & Terminal Configuration</Text>
      </View>

      <View className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl mb-6 relative overflow-hidden">
        <Text className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Active System License</Text>
        <Text className="text-2xl font-black text-white uppercase tracking-tighter truncate">{profile?.businessName || 'Anonymous Branch'}</Text>
        <Text className="text-zinc-500 font-mono text-[10px] mt-0.5 truncate">{user?.email || 'no-email-linked'}</Text>
        
        <View className="mt-4 flex-row gap-2">
          <View className="px-2 py-1 rounded bg-emerald-500/10">
            <Text className="text-emerald-500 text-[9px] font-black uppercase">
              {profile?.isPaid ? '🛡️ Premium Node' : '⏳ Evaluation Mode'}
            </Text>
          </View>
          {profile?.accessExpiresAt && (
            <View className="px-2 py-1 bg-zinc-900 rounded">
              <Text className="text-zinc-400 text-[9px] font-black uppercase">
                {Math.max(0, Math.ceil((profile.accessExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} Days Left
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="mb-6 space-y-2">
        <Text className="text-[10px] font-black uppercase text-zinc-500 pl-2 tracking-widest">💳 SUBSCRIPTION TRACKING</Text>
        <View className="bg-zinc-950 border border-zinc-900 p-5 rounded-3xl">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-white text-lg font-black tracking-tight">₦15,000 / Month</Text>
              <Text className="text-zinc-500 text-[9px] uppercase tracking-wider mt-0.5">Continuous Distributed Sync Uplinks</Text>
            </View>
            <Text className="text-emerald-500 text-xl font-bold">✓</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setTriggerPaystack(true)}
            disabled={isUpdatingProfile}
            className="w-full h-12 bg-white rounded-xl items-center justify-center flex-row active:scale-95"
          >
            {isUpdatingProfile ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black uppercase text-xs tracking-widest">RENEW PREMIUM APP KEY</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6 space-y-2">
        <Text className="text-[10px] font-black uppercase text-zinc-500 pl-2 tracking-widest">🏬 BUSINESS PROPERTIES</Text>
        <View className="bg-zinc-950 border border-zinc-900 p-4 rounded-3xl space-y-4">
          <View className="space-y-1">
            <Text className="text-[9px] font-black uppercase text-zinc-500 pl-1">Store Outlet Label</Text>
            <TextInput
              value={profileForm.businessName}
              onChangeText={(text) => setProfileForm({ ...profileForm, businessName: text })}
              className="w-full h-12 bg-zinc-900 rounded-xl px-4 text-white font-bold text-xs border border-zinc-800"
              placeholder="Enterprise Name"
              placeholderTextColor="#27272a"
            />
          </View>

          <View className="space-y-1">
            <Text className="text-[9px] font-black uppercase text-zinc-500 pl-1">Physical Warehouse Location Address</Text>
            <TextInput
              value={profileForm.businessAddress}
              onChangeText={(text) => setProfileForm({ ...profileForm, businessAddress: text })}
              className="w-full h-12 bg-zinc-900 rounded-xl px-4 text-white font-bold text-xs border border-zinc-800"
              placeholder="Address Layout"
              placeholderTextColor="#27272a"
            />
          </View>

          <View className="space-y-1">
            <Text className="text-[9px] font-black uppercase text-zinc-500 pl-1">Business Phone Number Line</Text>
            <TextInput
              value={profileForm.businessPhone}
              onChangeText={(text) => setProfileForm({ ...profileForm, businessPhone: text })}
              keyboardType="phone-pad"
              className="w-full h-12 bg-zinc-900 rounded-xl px-4 text-white font-bold text-xs border border-zinc-800"
              placeholder="+234..."
              placeholderTextColor="#27272a"
            />
          </View>

          <TouchableOpacity
            onPress={handleUpdateProfile}
            disabled={isUpdatingProfile}
            className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl items-center justify-center"
          >
            {isUpdatingProfile ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-xs font-black uppercase tracking-widest">SAVE COMPONENT UPDATES</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6 space-y-2">
        <Text className="text-[10px] font-black uppercase text-zinc-500 pl-2 tracking-widest">📊 STATEMENTS & TRANSACTION EXPORTS</Text>
        <View className="bg-zinc-950 border border-zinc-900 p-4 rounded-3xl space-y-4">
          <View className="flex-row space-x-3">
            <View className="flex-1 space-y-1">
              <Text className="text-[9px] font-black uppercase text-zinc-500 pl-1">Start Point</Text>
              <TextInput
                value={dateRange.start}
                onChangeText={(t) => setDateRange({ ...dateRange, start: t })}
                className="w-full h-10 bg-zinc-900 rounded-lg px-3 text-white font-mono text-xs border border-zinc-800"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#27272a"
              />
            </View>
            <View className="flex-1 space-y-1">
              <Text className="text-[9px] font-black uppercase text-zinc-500 pl-1">End Point</Text>
              <TextInput
                value={dateRange.end}
                onChangeText={(t) => setDateRange({ ...dateRange, end: t })}
                className="w-full h-10 bg-zinc-900 rounded-lg px-3 text-white font-mono text-xs border border-zinc-800"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#27272a"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={exportToCSV}
            disabled={isExporting}
            className="w-full h-12 bg-white rounded-xl items-center justify-center flex-row"
          >
            {isExporting ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black uppercase text-xs tracking-widest">📥 STREAM COMPILED CSV DATA</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6 space-y-2">
        <Text className="text-[10px] font-black uppercase text-zinc-500 pl-2 tracking-widest">🗂️ BULK DATA PIPELINE INTERFACES</Text>
        <View className="bg-zinc-950 border border-zinc-900 p-4 rounded-3xl space-y-3">
          <TouchableOpacity
            onPress={() => setShowBulkUploadGate(true)}
            className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl items-center justify-center"
          >
            <Text className="text-zinc-300 text-xs font-black uppercase tracking-widest">⚡ EXECUTE BULK INVENTORY REWRITE</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={downloadCSVTemplate} className="w-full items-center py-2">
            <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest underline">Download Standard Schema Template CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-6 space-y-2">
        <Text className="text-[10px] font-black uppercase text-zinc-500 pl-2 tracking-widest">🔐 ADMINISTRATIVE AUTHORIZATION SYSTEMS</Text>
        <TouchableOpacity
          onPress={() => { setShowSecurityModal(true); setSecurityStep('password'); }}
          className="w-full h-14 bg-zinc-950 border border-zinc-900 rounded-3xl px-5 flex-row justify-between items-center"
        >
          <Text className="text-white text-xs font-black uppercase tracking-wider">Configure Admin Authorization PIN</Text>
          <Text className="text-zinc-600 font-bold">➔</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6 space-y-2">
        <Text className="text-[10px] font-black uppercase text-zinc-500 pl-2 tracking-widest">🛠️ TECH SUPPORT DESK</Text>
        <TouchableOpacity
          onPress={() => setIsSupportOpen(true)}
          className="w-full h-14 bg-zinc-950 border border-zinc-900 rounded-3xl px-5 flex-row justify-between items-center"
        >
          <Text className="text-white text-xs font-black uppercase tracking-wider">File System Bug Report Ticket</Text>
          <Text className="text-zinc-600 font-bold">✉️</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => {
          Alert.alert('Session Closure', 'Terminate active system terminal synchronization tokens?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Terminate Session', onPress: logout }
          ]);
        }}
        className="w-full h-14 border border-red-900/40 bg-red-950/10 rounded-3xl items-center justify-center mt-6"
      >
        <Text className="text-red-500 text-xs font-black uppercase tracking-widest">✕ TERMINATE ACCOUNT LINK</Text>
      </TouchableOpacity>

      <Modal visible={showSecurityModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/80 p-4">
          <View className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-4 pb-10">
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-black text-sm uppercase tracking-wider">Security PIN Configuration</Text>
              <TouchableOpacity onPress={() => setShowSecurityModal(false)} className="bg-zinc-900 p-2 rounded-full">
                <Text className="text-zinc-400 font-bold text-xs">✕</Text>
              </TouchableOpacity>
            </View>

            {securityStep === 'password' ? (
              <View className="space-y-3">
                <Text className="text-zinc-400 text-xs font-semibold">Enter your profile master password to unlock administrative operations settings:</Text>
                <TextInput
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Master System Password"
                  placeholderTextColor="#3f3f46"
                  className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white text-sm"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-zinc-500 text-[10px] uppercase font-bold text-right">{showPassword ? 'Hide Secret Strings' : 'Reveal Hidden Input'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleReauth} disabled={secLoading} className="w-full h-12 bg-white rounded-xl items-center justify-center">
                  {secLoading ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black uppercase text-xs tracking-widest">VERIFY REAUTH TOKEN</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View className="space-y-3">
                <Text className="text-zinc-400 text-xs font-semibold">Enter your new 4-digit master overlay verification PIN:</Text>
                <TextInput
                  keyboardType="numeric"
                  maxLength={4}
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="XXXX"
                  placeholderTextColor="#3f3f46"
                  className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-3xl font-black text-white tracking-[0.5em]"
                />
                <TouchableOpacity onPress={handleSetPin} disabled={secLoading} className="w-full h-12 bg-emerald-600 rounded-xl items-center justify-center">
                  {secLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-black uppercase text-xs tracking-widest">WRITE NEW PIN LOCK</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showBulkUploadGate} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/90 p-6">
          <View className="w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-6 space-y-4">
            <Text className="text-center text-red-500 font-black text-xs uppercase tracking-widest">⚠️ Administrative Override Challenge</Text>
            <Text className="text-zinc-400 text-xs font-bold text-center">Confirm your 4-digit administrative verification PIN to unlock database upload tools:</Text>
            
            <TextInput
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={bulkPin}
              onChangeText={setBulkPin}
              placeholder="••••"
              placeholderTextColor="#3f3f46"
              className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-2xl text-center text-2xl text-white font-bold"
            />

            <View className="flex-row space-x-2 pt-2">
              <TouchableOpacity onPress={() => { setShowBulkUploadGate(false); setBulkPin(''); }} className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-xl items-center justify-center">
                <Text className="text-zinc-400 font-bold text-xs uppercase">Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkPinSubmit} className="flex-1 h-12 bg-white rounded-xl items-center justify-center">
                <Text className="text-black font-black text-xs uppercase">Unlock Pipeline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showBulkScanner} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/80 p-4">
          <View className="bg-zinc-950 border border-zinc-900 rounded-t-3xl p-6 pb-12 space-y-5">
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-black text-sm uppercase tracking-wider">CSV Processing Matrix Node</Text>
              <TouchableOpacity onPress={() => { setShowBulkScanner(false); setParsedItems([]); }} className="bg-zinc-900 p-2 rounded-full">
                <Text className="text-zinc-400 font-bold text-xs">✕</Text>
              </TouchableOpacity>
            </View>

            {parsedItems.length === 0 ? (
              <TouchableOpacity
                onPress={pickDocument}
                disabled={isParsing}
                className="w-full h-32 border-2 border-dashed border-zinc-800 bg-zinc-900/40 rounded-2xl items-center justify-center space-y-2"
              >
                {isParsing ? <ActivityIndicator color="#fff" /> : (
                  <View className="items-center justify-center">
                    <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wide">Select Document Source File</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View className="space-y-4">
                <View className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                  <Text className="text-white text-xs font-black uppercase tracking-tight">Dataset Staged Successfully</Text>
                  <Text className="text-zinc-400 text-[11px] font-bold mt-1">Total items detected for upload array payload: {parsedItems.length}</Text>
                </View>

                <View className="flex-row justify-between items-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-900">
                  <View>
                    <Text className="text-white text-xs font-bold uppercase">Purge Existing Inventories</Text>
                    <Text className="text-zinc-500 text-[9px] uppercase tracking-tighter">Deletes current records entirely before rewrite</Text>
                  </View>
                  <Switch
                    value={replaceEntire}
                    onValueChange={setReplaceEntire}
                    trackColor={{ false: '#27272a', true: '#ef4444' }}
                    thumbColor="#fff"
                  />
                </View>

                <TouchableOpacity
                  onPress={executeUpload}
                  disabled={isUploading}
                  className={`w-full h-14 ${replaceEntire ? 'bg-red-600' : 'bg-white'} rounded-xl items-center justify-center`}
                >
                  {isUploading ? (
                    <View className="items-center justify-center">
                      <ActivityIndicator color={replaceEntire ? '#fff' : '#000'} />
                      <Text className="text-[8px] font-mono mt-1 font-black">{uploadProgress}% written</Text>
                    </View>
                  ) : (
                    <Text className={`${replaceEntire ? 'text-white' : 'text-black'} font-black uppercase text-xs tracking-widest`}>
                      {replaceEntire ? '🔥 INJECT & PURGE PREVIOUS COLLECTIONS' : '🚀 WRITE TO REMOTE INVENTORY'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </ScrollView>
  );
}