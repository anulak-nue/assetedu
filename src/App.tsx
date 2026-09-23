import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { AssetItem, AssetStatus, DashboardStats, AppConfig } from './types';
import {
  loadStoredConfig,
  saveStoredConfig,
  loadStoredAssets,
  saveStoredAssets,
  loadOfflineQueue,
  saveOfflineQueue,
} from './services/storage';
import {
  initFirebase,
  subscribeToAssets,
  saveAssetToFirestore,
  batchSaveAssetsToFirestore,
} from './services/firebase';
import { fetchFromGoogleSheets, pushToGoogleSheets } from './services/sheets';
import { getInitialTestAssets, parseCsvToAssets } from './data/initialTestAssets';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { FilterBar } from './components/FilterBar';
import { AssetTable } from './components/AssetTable';
import { BulkActionToolbar } from './components/BulkActionToolbar';
import { InspectionModal } from './components/InspectionModal';
import { AddAssetModal } from './components/AddAssetModal';
import { QrScannerModal } from './components/QrScannerModal';
import { SettingsModal } from './components/SettingsModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, getCurrentUser } from './services/googleAuth';

export default function App() {
  // App Config state
  const [config, setConfig] = useState<AppConfig>(loadStoredConfig);

  // Asset Data state
  const [assets, setAssets] = useState<AssetItem[]>(() => {
    const saved = loadStoredAssets();
    if (saved && saved.length > 0) return saved;
    // Pre-populate with initial test assets on first launch so user has working data instantly!
    return getInitialTestAssets();
  });

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<Partial<AssetItem>[]>(loadOfflineQueue);

  // Connection states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);

  // Filter and Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Bulk selection state (stores asset id or sapNo)
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  // Modal and Interaction states
  const [inspectingAsset, setInspectingAsset] = useState<AssetItem | null>(null);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGoogleWorkspaceOpen, setIsGoogleWorkspaceOpen] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<User | null>(getCurrentUser);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const speechRecognitionRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Listen to Google Auth state
  useEffect(() => {
    const unsub = initAuth(
      (u) => setGoogleUser(u),
      () => setGoogleUser(null)
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Sync to localStorage whenever assets change
  useEffect(() => {
    saveStoredAssets(assets);
  }, [assets]);

  // Sync offline queue to localStorage
  useEffect(() => {
    saveOfflineQueue(offlineQueue);
  }, [offlineQueue]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('เชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
      processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('อยู่ในโหมดออฟไลน์ (ข้อมูลจะถูกบันทึกในเครื่อง)', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Firebase and subscribe to Firestore for real-time collaboration
  useEffect(() => {
    const { db } = initFirebase(config.firebaseConfig);
    if (!db) {
      setIsFirebaseConnected(false);
      return;
    }

    setIsFirebaseConnected(true);
    const unsub = subscribeToAssets(
      (remoteAssets, fromCache) => {
        if (remoteAssets && remoteAssets.length > 0) {
          setAssets(remoteAssets);
          if (!fromCache) {
            setIsFirebaseConnected(true);
          }
        }
      },
      () => {
        setIsFirebaseConnected(false);
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [config.firebaseConfig]);

  // Process offline queue
  const processOfflineQueue = useCallback(async () => {
    const currentQueue = loadOfflineQueue();
    if (currentQueue.length === 0 || !navigator.onLine) return;

    try {
      if (config.gasWebAppUrl) {
        await pushToGoogleSheets(config.gasWebAppUrl, currentQueue);
      }
      setOfflineQueue([]);
      saveOfflineQueue([]);
      showToast(`ซิงค์ข้อมูลค้างส่งเรียบร้อยแล้ว (${currentQueue.length} รายการ)`, 'success');
    } catch (e) {
      console.warn('Deferred offline sync retry failed:', e);
    }
  }, [config.gasWebAppUrl, showToast]);

  // Queue item when offline
  const enqueueOfflineUpdate = useCallback((item: Partial<AssetItem>) => {
    setOfflineQueue((prev) => [...prev, item]);
  }, []);

  // Update a single asset locally, to Firestore and to Google Sheets
  const updateSingleAsset = useCallback(
    async (updated: AssetItem, toastMsg?: string) => {
      // 1. Update React state immediately
      setAssets((prev) =>
        prev.map((a) => ((a.id === updated.id || a.sapNo === updated.sapNo) ? updated : a))
      );

      // 2. Save to Firestore (Real-time team collaboration)
      saveAssetToFirestore(updated).catch((err) =>
        console.warn('Firestore sync warning:', err)
      );

      // 3. Push to Google Sheets
      if (config.gasWebAppUrl && navigator.onLine) {
        pushToGoogleSheets(config.gasWebAppUrl, updated).catch(() => {
          enqueueOfflineUpdate(updated);
        });
      } else {
        enqueueOfflineUpdate(updated);
      }

      showToast(toastMsg || `บันทึกรหัส SAP: ${updated.sapNo} เรียบร้อย`, 'success');
    },
    [config.gasWebAppUrl, enqueueOfflineUpdate, showToast]
  );

  // Quick update status directly from table dropdown
  const handleQuickUpdateStatus = useCallback(
    (assetId: string, newStatus: AssetStatus) => {
      const existing = assets.find((a) => a.id === assetId || a.sapNo === assetId);
      if (!existing) return;

      const updated: AssetItem = {
        ...existing,
        status: newStatus,
        updatedBy: config.inspectorName || 'ผู้ตรวจ',
        updatedAt: new Date().toISOString(),
      };

      updateSingleAsset(updated, `อัปเดตสถานะ ${existing.sapNo} เป็น "${getStatusLabel(newStatus)}"`);
    },
    [assets, config.inspectorName, updateSingleAsset]
  );

  // Full inspection modal submit
  const handleSaveInspection = useCallback(
    (updatedAsset: AssetItem) => {
      updateSingleAsset(updatedAsset, `บันทึกผลตรวจรหัส ${updatedAsset.sapNo} สำเร็จ`);
      setInspectingAsset(null);
    },
    [updateSingleAsset]
  );

  // Add new asset manually
  const handleAddNewAsset = useCallback(
    (newAsset: AssetItem) => {
      setAssets((prev) => [newAsset, ...prev]);
      saveStoredAssets([newAsset, ...assets]);
      batchSaveAssetsToFirestore([newAsset]).catch((err) =>
        console.warn('Firestore add asset warning:', err)
      );

      if (config.gasWebAppUrl && navigator.onLine) {
        pushToGoogleSheets(config.gasWebAppUrl, newAsset).catch(() => {
          enqueueOfflineUpdate(newAsset);
        });
      } else {
        enqueueOfflineUpdate(newAsset);
      }

      showToast(`เพิ่มครุภัณฑ์รหัส "${newAsset.sapNo}" เรียบร้อยแล้ว`, 'success');
    },
    [assets, config.gasWebAppUrl, enqueueOfflineUpdate, showToast]
  );

  // Bulk update handler for multiple selected assets (status and team)
  const handleBulkUpdateStatus = useCallback(
    async (newStatus: AssetStatus) => {
      if (selectedAssetIds.size === 0) return;

      const now = new Date().toISOString();
      const updatedList: AssetItem[] = [];

      setAssets((prev) =>
        prev.map((item) => {
          const key = item.id || item.sapNo;
          if (selectedAssetIds.has(key)) {
            const updated: AssetItem = {
              ...item,
              status: newStatus,
              updatedBy: config.inspectorName || 'ผู้ตรวจ',
              updatedAt: now,
            };
            updatedList.push(updated);
            return updated;
          }
          return item;
        })
      );

      // Batch push to Firestore
      batchSaveAssetsToFirestore(updatedList).catch((err) =>
        console.warn('Batch firestore save error:', err)
      );

      // Push to Google Sheets
      if (config.gasWebAppUrl && navigator.onLine) {
        pushToGoogleSheets(config.gasWebAppUrl, updatedList).catch(() => {
          updatedList.forEach(enqueueOfflineUpdate);
        });
      } else {
        updatedList.forEach(enqueueOfflineUpdate);
      }

      showToast(
        `อัปเดตสถานะเป็น "${getStatusLabel(newStatus)}" จำนวน ${updatedList.length} รายการเรียบร้อย`,
        'success'
      );
      setSelectedAssetIds(new Set());
    },
    [selectedAssetIds, config.inspectorName, config.gasWebAppUrl, enqueueOfflineUpdate, showToast]
  );

  const handleBulkAssignTeam = useCallback(
    async (newTeam: string) => {
      if (selectedAssetIds.size === 0) return;

      const now = new Date().toISOString();
      const teamVal = newTeam === '__clear__' ? '' : newTeam;
      const updatedList: AssetItem[] = [];

      setAssets((prev) =>
        prev.map((item) => {
          const key = item.id || item.sapNo;
          if (selectedAssetIds.has(key)) {
            const updated: AssetItem = {
              ...item,
              team: teamVal,
              updatedBy: config.inspectorName || 'ผู้ตรวจ',
              updatedAt: now,
            };
            updatedList.push(updated);
            return updated;
          }
          return item;
        })
      );

      // Batch push to Firestore
      batchSaveAssetsToFirestore(updatedList).catch((err) =>
        console.warn('Batch firestore save error:', err)
      );

      // Push to Google Sheets
      if (config.gasWebAppUrl && navigator.onLine) {
        pushToGoogleSheets(config.gasWebAppUrl, updatedList).catch(() => {
          updatedList.forEach(enqueueOfflineUpdate);
        });
      } else {
        updatedList.forEach(enqueueOfflineUpdate);
      }

      showToast(
        teamVal
          ? `มอบหมายทีม "${teamVal}" จำนวน ${updatedList.length} รายการเรียบร้อย`
          : `ล้างการมอบหมายทีม ${updatedList.length} รายการเรียบร้อย`,
        'success'
      );
      setSelectedAssetIds(new Set());
    },
    [selectedAssetIds, config.inspectorName, config.gasWebAppUrl, enqueueOfflineUpdate, showToast]
  );

  // Toggle selection for a single asset
  const handleToggleSelectAsset = useCallback((assetId: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  }, []);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectedAssetIds(new Set());
  }, []);

  // Select all visible assets on the current page
  const handleSelectAllVisible = useCallback((visibleAssets: AssetItem[]) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      visibleAssets.forEach((a) => next.add(a.id || a.sapNo));
      return next;
    });
  }, []);

  // Toggle select all visible assets on the current page
  const handleToggleSelectAllVisible = useCallback((visibleAssets: AssetItem[]) => {
    setSelectedAssetIds((prev) => {
      const allSelected =
        visibleAssets.length > 0 &&
        visibleAssets.every((a) => prev.has(a.id || a.sapNo));
      const next = new Set(prev);
      if (allSelected) {
        visibleAssets.forEach((a) => next.delete(a.id || a.sapNo));
      } else {
        visibleAssets.forEach((a) => next.add(a.id || a.sapNo));
      }
      return next;
    });
  }, []);

  // Load test data button action
  const handleLoadTestData = useCallback(async () => {
    const testItems = getInitialTestAssets();
    setAssets(testItems);
    saveStoredAssets(testItems);
    setCurrentPage(1);
    setSelectedLocation('all');
    setSelectedRoom('all');
    setSelectedTeam('all');
    setStatusFilter('all');
    setSearchTerm('');

    showToast(`โหลดข้อมูลทดสอบเรียบร้อยแล้ว (${testItems.length} รายการ)`, 'success');

    // Batch upload to Firestore so all team members receive the test data in real-time
    batchSaveAssetsToFirestore(testItems).catch((err) =>
      console.warn('Batch firestore save warning:', err)
    );

    // Sync to Google Sheets if connected
    if (config.gasWebAppUrl && navigator.onLine) {
      pushToGoogleSheets(config.gasWebAppUrl, testItems).catch((err) =>
        console.warn('Batch Google Sheets save warning:', err)
      );
    }
  }, [config.gasWebAppUrl, showToast]);

  // Pull from Google Sheets
  const handleSyncSheets = useCallback(async () => {
    if (!config.gasWebAppUrl) {
      showToast('กรุณาระบุ URL ของ Google Apps Script ในเมนูตั้งค่าก่อน', 'error');
      setIsSettingsOpen(true);
      return;
    }

    setIsSyncingSheets(true);
    try {
      const items = await fetchFromGoogleSheets(config.gasWebAppUrl);
      if (items && items.length > 0) {
        setAssets(items);
        saveStoredAssets(items);
        batchSaveAssetsToFirestore(items).catch((err) => console.warn('Firestore sync:', err));
        showToast(`ดึงข้อมูลจาก Google Sheets สำเร็จ (${items.length} รายการ)`, 'success');
      } else {
        showToast('ไม่พบรายการพัสดุใน Google Sheets', 'error');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`ดึงข้อมูลไม่สำเร็จ: ${msg}`, 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  }, [config.gasWebAppUrl, showToast]);

  // Google Sign-In direct trigger from Navbar
  const handleGoogleSignInDirect = useCallback(async () => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        showToast(`ลงชื่อเข้าใช้ Google ในชื่อ ${res.user.displayName || res.user.email} สำเร็จ`, 'success');
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`, 'error');
    }
  }, [showToast]);

  // Import Assets from Google Sheets (via Google Workspace API)
  const handleImportFromGoogleWorkspace = useCallback(
    (importedItems: AssetItem[], sourceTitle: string) => {
      if (importedItems.length === 0) return;

      setAssets(importedItems);
      saveStoredAssets(importedItems);
      setCurrentPage(1);
      setSelectedLocation('all');
      setSelectedRoom('all');
      setSelectedTeam('all');
      setStatusFilter('all');
      setSearchTerm('');

      // Batch save to Firestore for real-time collaboration
      batchSaveAssetsToFirestore(importedItems).catch((err) =>
        console.warn('Batch firestore save error:', err)
      );

      showToast(`นำเข้าข้อมูลพัสดุจาก ${sourceTitle} สำเร็จ (${importedItems.length} รายการ)`, 'success');
    },
    [showToast]
  );

  // Import Asset CSV
  const handleImportAssetsCsv = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        try {
          const imported = parseCsvToAssets(text, config.inspectorName || 'นำเข้า CSV');
          if (imported.length > 0) {
            // Merge with existing assets
            const map = new Map<string, AssetItem>();
            assets.forEach((a) => map.set(a.sapNo, a));
            imported.forEach((a) => map.set(a.sapNo, { ...map.get(a.sapNo), ...a }));
            const merged = Array.from(map.values());

            setAssets(merged);
            saveStoredAssets(merged);
            batchSaveAssetsToFirestore(imported).catch((err) => console.warn('Firestore err:', err));

            if (config.gasWebAppUrl && navigator.onLine) {
              pushToGoogleSheets(config.gasWebAppUrl, imported).catch(() => {});
            }

            showToast(`นำเข้าข้อมูลพัสดุสำเร็จ ${imported.length} รายการ`, 'success');
          } else {
            showToast('ไม่พบข้อมูลหรือรูปแบบ CSV ไม่ถูกต้อง', 'error');
          }
        } catch (err) {
          showToast('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV', 'error');
        }
      };
      reader.readAsText(file, 'UTF-8');
    },
    [assets, config.gasWebAppUrl, config.inspectorName, showToast]
  );

  // Import Teams CSV (Matches SAP number and assigns team)
  const handleImportTeamsCsv = useCallback(
    (file: File) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let matched = 0;
          const map = new Map<string, AssetItem>();
          assets.forEach((a) => map.set(a.sapNo, a));
          const updatedItems: AssetItem[] = [];

          results.data.forEach((row) => {
            const sapRaw = (
              row['หมายเลขครุภัณฑ์'] ||
              row['รหัสSAP'] ||
              row['SAP'] ||
              row['sap'] ||
              ''
            ).trim();
            const teamVal = (
              row['แบ่งทีม'] ||
              row['ทีมตรวจ'] ||
              row['ทีม'] ||
              row['Team'] ||
              ''
            ).trim();

            if (sapRaw && teamVal && map.has(sapRaw)) {
              const current = map.get(sapRaw)!;
              const updated = {
                ...current,
                team: teamVal,
                updatedBy: config.inspectorName || 'กำหนดทีม',
                updatedAt: new Date().toISOString(),
              };
              map.set(sapRaw, updated);
              updatedItems.push(updated);
              matched++;
            }
          });

          if (matched > 0) {
            const newAssetList = Array.from(map.values());
            setAssets(newAssetList);
            saveStoredAssets(newAssetList);
            batchSaveAssetsToFirestore(updatedItems).catch((err) => console.warn(err));

            if (config.gasWebAppUrl && navigator.onLine) {
              pushToGoogleSheets(config.gasWebAppUrl, updatedItems).catch(() => {});
            }

            showToast(`กำหนดทีมตรวจตามรหัส SAP สำเร็จ ${matched} รายการ`, 'success');
          } else {
            showToast('ไม่พบรหัส SAP ที่ตรงกับในระบบ', 'error');
          }
        },
      });
    },
    [assets, config.gasWebAppUrl, config.inspectorName, showToast]
  );

  // Export to CSV
  const handleExportCsv = useCallback(() => {
    if (assets.length === 0) {
      showToast('ไม่มีรายการพัสดุให้ส่งออก', 'error');
      return;
    }

    const exportRows = assets.map((a, idx) => ({
      'ลำดับที่': idx + 1,
      'หมายเลขครุภัณฑ์ (SAP)': a.sapNo,
      'รายละเอียดพัสดุ': a.name,
      'Serial no.': a.serialNo || '-',
      'สถานที่ตั้ง': a.location,
      'ห้อง': a.room,
      'ทีมตรวจ': a.team || '',
      'สถานะการตรวจ': getStatusLabel(a.status),
      'ใช้งานได้': a.status === 'found' ? '✓' : '',
      'ชำรุด': a.status === 'broken' ? '✓' : '',
      'เสื่อมสภาพ': a.status === 'deteriorated' ? '✓' : '',
      'ตรวจไม่พบ': a.status === 'missing' ? '✓' : '',
      'หน่วยงานผู้ถือครองไม่ถูกต้อง': a.invalidDepartment ? 'ใช่' : '',
      'สถานที่ตั้งไม่ถูกต้อง': a.invalidLocation ? 'ใช่' : '',
      'ไม่มียี่ห้อ/รุ่น หรือมีแต่ไม่ถูกต้อง': a.invalidModel ? 'ใช่' : '',
      'ขอรับป้ายสติ๊กเกอร์': a.requestSticker ? 'ใช่' : '',
      'ระบุสาเหตุ / รายละเอียดที่ต้องแก้ไข': a.note || '',
      'ปีงบ': a.budgetYear || '',
      'มูลค่า': a.value || '',
      'ชื่อผู้ขาย': a.vendor || '',
      'สถานะการส่งคืน': a.returnedTo || '',
      'ผู้ตรวจล่าสุด': a.updatedBy || '',
      'วันเวลาที่ตรวจ': a.updatedAt ? new Date(a.updatedAt).toLocaleString('th-TH') : '',
    }));

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานผลการตรวจสอบพัสดุ_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว', 'success');
  }, [assets, showToast]);

  // Voice Search (Web Speech API)
  const handleStartVoiceSearch = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('เบราว์เซอร์นี้ไม่รองรับการสั่งงานด้วยเสียง (แนะนำ Google Chrome)', 'error');
      return;
    }

    if (speechRecognitionRef.current && isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.lang = 'th-TH';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        showToast('กำลังฟังเสียงพูด...', 'success');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setSearchTerm(text);
        setCurrentPage(1);
        showToast(`ค้นหา: "${text}"`, 'success');
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      showToast('ไม่สามารถเปิดใช้งานไมโครโฟนได้', 'error');
    }
  }, [isListening, showToast]);

  // QR / Barcode scanned
  const handleQrScanSuccess = useCallback(
    (code: string) => {
      const cleanCode = code.trim();
      setSearchTerm(cleanCode);
      setCurrentPage(1);
      showToast(`สแกนพบรหัส: ${cleanCode}`, 'success');

      // Check if exact SAP matches, open inspect modal immediately!
      const match = assets.find((a) => a.sapNo === cleanCode);
      if (match) {
        setInspectingAsset(match);
      }
    },
    [assets, showToast]
  );

  // Available unique Locations
  const availableLocations = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      if (a.location && a.location !== '-') set.add(a.location);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [assets]);

  // Available Rooms (Cascaded from selectedLocation)
  const availableRooms = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      if (
        (selectedLocation === 'all' || a.location === selectedLocation) &&
        a.room &&
        a.room !== '-'
      ) {
        set.add(a.room);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [assets, selectedLocation]);

  // Available Teams
  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      if (a.team) set.add(a.team);
    });
    return Array.from(set).sort();
  }, [assets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return assets.filter((a) => {
      // Location filter
      if (selectedLocation !== 'all' && a.location !== selectedLocation) return false;

      // Room filter (dependent on location)
      if (selectedRoom !== 'all' && a.room !== selectedRoom) return false;

      // Team filter
      if (selectedTeam !== 'all' && a.team !== selectedTeam) return false;

      // Status filter
      if (statusFilter === 'pending' && a.status !== 'pending') return false;
      if (statusFilter === 'found' && a.status !== 'found') return false;
      if (statusFilter === 'broken' && a.status !== 'broken') return false;
      if (statusFilter === 'deteriorated' && a.status !== 'deteriorated') return false;
      if (statusFilter === 'missing' && a.status !== 'missing') return false;
      if (statusFilter === 'invalid-registry' && !(a.invalidDepartment || a.invalidLocation || a.invalidModel))
        return false;
      if (statusFilter === 'sticker' && !a.requestSticker) return false;
      if (
        statusFilter === 'return-supply' &&
        (!a.returnedTo ||
          (!a.returnedTo.toLowerCase().includes('พัสดุ') &&
            !a.returnedTo.toLowerCase().includes('supply')))
      )
        return false;
      if (
        statusFilter === 'return-it' &&
        (!a.returnedTo ||
          (!a.returnedTo.toLowerCase().includes('สารสนเทศ') &&
            !a.returnedTo.toLowerCase().includes('it')))
      )
        return false;

      // Search term filter (SAP, name, location, room, serialNo, team)
      if (query) {
        const matchSap = a.sapNo && a.sapNo.toLowerCase().includes(query);
        const matchName = a.name && a.name.toLowerCase().includes(query);
        const matchLoc = a.location && a.location.toLowerCase().includes(query);
        const matchRoom = a.room && a.room.toLowerCase().includes(query);
        const matchSn = a.serialNo && a.serialNo.toLowerCase().includes(query);
        const matchTeam = a.team && a.team.toLowerCase().includes(query);
        const matchUser = a.updatedBy && a.updatedBy.toLowerCase().includes(query);

        if (!matchSap && !matchName && !matchLoc && !matchRoom && !matchSn && !matchTeam && !matchUser) {
          return false;
        }
      }

      return true;
    });
  }, [assets, searchTerm, selectedLocation, selectedRoom, selectedTeam, statusFilter]);

  // Paginated Assets for current page
  const pagedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, currentPage, pageSize]);

  // Dashboard Statistics
  const dashboardStats: DashboardStats = useMemo(() => {
    let pending = 0;
    let found = 0;
    let broken = 0;
    let deteriorated = 0;
    let missing = 0;
    let invalidRegistry = 0;
    let requestSticker = 0;

    assets.forEach((a) => {
      if (a.status === 'pending') pending++;
      else if (a.status === 'found') found++;
      else if (a.status === 'broken') broken++;
      else if (a.status === 'deteriorated') deteriorated++;
      else if (a.status === 'missing') missing++;

      if (a.invalidDepartment || a.invalidLocation || a.invalidModel) invalidRegistry++;
      if (a.requestSticker) requestSticker++;
    });

    return {
      total: assets.length,
      pending,
      found,
      broken,
      deteriorated,
      missing,
      invalidRegistry,
      requestSticker,
    };
  }, [assets]);

  // Handle location change: reset room and page
  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc);
    setSelectedRoom('all');
    setCurrentPage(1);
  };

  const handleRoomChange = (room: string) => {
    setSelectedRoom(room);
    setCurrentPage(1);
  };

  const handleTeamChange = (team: string) => {
    setSelectedTeam(team);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/90 text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          id="toast-notification"
          className="fixed top-5 right-5 z-50 animate-bounce duration-300"
        >
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        config={config}
        isOnline={isOnline}
        isFirebaseConnected={isFirebaseConnected}
        isSyncingSheets={isSyncingSheets}
        offlineQueueCount={offlineQueue.length}
        googleUser={googleUser}
        onOpenGoogleWorkspace={() => setIsGoogleWorkspaceOpen(true)}
        onGoogleSignIn={handleGoogleSignInDirect}
        onLoadTestData={handleLoadTestData}
        onSyncSheets={handleSyncSheets}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col">
        {/* Top Summary Dashboard */}
        <Dashboard
          stats={dashboardStats}
          currentStatusFilter={statusFilter}
          onFilterChange={handleStatusFilterChange}
        />

        {/* Filter and Search Bar */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          availableLocations={availableLocations}
          selectedRoom={selectedRoom}
          onRoomChange={handleRoomChange}
          availableRooms={availableRooms}
          selectedTeam={selectedTeam}
          onTeamChange={handleTeamChange}
          availableTeams={availableTeams}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onOpenQrScanner={() => setIsQrScannerOpen(true)}
          onStartVoiceSearch={handleStartVoiceSearch}
          isListening={isListening}
          onImportAssetsCsv={handleImportAssetsCsv}
          onImportTeamsCsv={handleImportTeamsCsv}
          onExportCsv={handleExportCsv}
          onOpenGoogleWorkspace={() => setIsGoogleWorkspaceOpen(true)}
          onOpenAddAsset={() => setIsAddAssetOpen(true)}
        />

        {/* Bulk Action Toolbar */}
        <BulkActionToolbar
          selectedCount={selectedAssetIds.size}
          totalVisibleCount={pagedAssets.length}
          availableTeams={availableTeams}
          onSelectAllVisible={() => handleSelectAllVisible(pagedAssets)}
          onClearSelection={handleClearSelection}
          onBulkUpdateStatus={handleBulkUpdateStatus}
          onBulkAssignTeam={handleBulkAssignTeam}
        />

        {/* Asset Inventory Table */}
        <AssetTable
          assets={pagedAssets}
          selectedAssetIds={selectedAssetIds}
          onToggleSelectAsset={handleToggleSelectAsset}
          onToggleSelectAllVisible={() => handleToggleSelectAllVisible(pagedAssets)}
          onQuickUpdateStatus={handleQuickUpdateStatus}
          onOpenInspectModal={(asset) => setInspectingAsset(asset)}
          currentPage={currentPage}
          pageSize={pageSize}
          totalFilteredCount={filteredAssets.length}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        <p>
          ระบบตรวจสอบพัสดุประจำปี &bull; Real-time Team Collaboration &bull; Google Sheets & Firebase Sync
        </p>
      </footer>

      {/* Inspection Modal */}
      {inspectingAsset && (
        <InspectionModal
          asset={inspectingAsset}
          inspectorName={config.inspectorName}
          onClose={() => setInspectingAsset(null)}
          onSave={handleSaveInspection}
        />
      )}

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAddAsset={handleAddNewAsset}
        availableLocations={availableLocations}
        availableRooms={availableRooms}
        availableTeams={availableTeams}
        inspectorName={config.inspectorName}
      />

      {/* QR/Barcode Camera Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        config={config}
        totalAssetsCount={assets.length}
        onClose={() => setIsSettingsOpen(false)}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
          saveStoredConfig(newCfg);
          showToast('บันทึกการตั้งค่าเรียบร้อยแล้ว', 'success');
        }}
        onClearAllData={() => {
          setAssets([]);
          saveStoredAssets([]);
          showToast('ล้างข้อมูลพัสดุในเครื่องเรียบร้อยแล้ว', 'success');
        }}
      />

      {/* Google Workspace (Drive & Sheets) Modal */}
      <GoogleWorkspaceModal
        isOpen={isGoogleWorkspaceOpen}
        currentUser={googleUser}
        assets={assets}
        onClose={() => setIsGoogleWorkspaceOpen(false)}
        onImportAssets={handleImportFromGoogleWorkspace}
        onToast={showToast}
      />
    </div>
  );
}

function getStatusLabel(status: AssetStatus): string {
  switch (status) {
    case 'found':
      return 'ใช้งานได้ (พบ)';
    case 'broken':
      return 'ชำรุด';
    case 'deteriorated':
      return 'เสื่อมสภาพ';
    case 'missing':
      return 'ตรวจไม่พบ';
    default:
      return 'ยังไม่ตรวจ';
  }
}
