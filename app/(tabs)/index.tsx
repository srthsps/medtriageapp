import { ThemeColors, ThemeContext } from '@/components/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useContext, useState } from 'react';
import {
  ActivityIndicator, Alert, Image,
  Modal, Pressable,
  ScrollView,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- GLOSSARY DATA ---
const GLOSSARY: { [key: string]: string } = {
  "Atelectasis": "A complete or partial collapse of the entire lung or area (lobe) of the lung. It occurs when the tiny air sacs (alveoli) within the lung become deflated or possibly filled with alveolar fluid.",
  "Cardiomegaly": "An enlarged heart, which is usually a sign of another condition rather than a disease itself. It can be caused by high blood pressure or coronary artery disease.",
  "Effusion": "Pleural effusion, sometimes referred to as 'water on the lungs,' is the build-up of excess fluid between the layers of the pleura outside the lungs.",
  "Infiltration": "A substance denser than air, such as pus, blood, or protein, which lingers within the parenchyma of the lungs. Often associated with pneumonia or tuberculosis.",
  "Mass": "A defined growth or lesion within the lung, typically larger than 3cm. While it can be cancer, it can also be a benign tumor or abscess.",
  "Nodule": "A small growth (less than 3cm) on the lung. Most lung nodules are noncancerous (benign), often caused by scars from past infections.",
  "Pneumonia": "An infection that inflames the air sacs in one or both lungs. The air sacs may fill with fluid or pus, causing cough with phlegm or fever.",
  "Pneumothorax": "A collapsed lung. This occurs when air leaks into the space between your lung and chest wall. This air pushes on the outside of your lung and makes it collapse.",
  "Consolidation": "A region of normally compressible lung tissue that has filled with liquid instead of air. It is a key sign of pneumonia.",
  "Edema": "Pulmonary edema is a condition caused by excess fluid in the lungs. This fluid collects in the numerous air sacs in the lungs, making it difficult to breathe.",
  "Emphysema": "A lung condition that causes shortness of breath. In people with emphysema, the air sacs in the lungs (alveoli) are damaged.",
  "Fibrosis": "Pulmonary fibrosis is a lung disease that occurs when lung tissue becomes damaged and scarred. This thickened, stiff tissue makes it more difficult for your lungs to work properly.",
  "Pleural Thickening": "Thickening of the lining of the lungs (pleura). It is often caused by inflammation or previous exposure to asbestos.",
  "Hernia": "Hiatal hernia occurs when the upper part of your stomach bulges through the large muscle separating your abdomen and chest (diaphragm)."
};

interface Disease { name: string; score: number; }
interface ApiResult { patientName: string; analysisDate: string; findings: Disease[]; imageBase64: string; }

export default function ScannerScreen() {
  const { isDark } = useContext(ThemeContext);
  const theme = isDark ? ThemeColors.dark : ThemeColors.light;
  const styles = getStyles(theme, isDark);

  // AWS Server IP
  const API_URL = "http://13.126.214.151/api/analysis"; 

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // UI States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<{name: string, desc: string} | null>(null);
  const [zoomVisible, setZoomVisible] = useState(false);

  const saveToHistory = async (newResult: ApiResult) => {
    try {
      // 1. Get existing history
      const existing = await AsyncStorage.getItem('scan_history');
      const history = existing ? JSON.parse(existing) : [];

      // 2. Add new item to top of list
      // We add a unique ID using date time to avoid key conflicts
      const newItem = { ...newResult, id: Date.now().toString() };
      const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50 only

      // 3. Save back
      await AsyncStorage.setItem('scan_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const pickAndUpload = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (doc.canceled) return;
      const file = doc.assets[0];
      setFileName(file.name);
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      // @ts-ignore
      formData.append("file", { uri: file.uri, name: file.name, type: "application/dicom" });

      const response = await fetch(API_URL, { 
        method: "POST", 
        body: formData, 
        headers: { "Content-Type": "multipart/form-data" } 
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Server Error");
      setResult(json);
      saveToHistory(json);
    } catch (error: any) { 
      Alert.alert("Error", error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const generatePDF = async () => {
    if (!result) return;
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; }
            h1 { color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .patient-info { background: #f4f6f8; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .scan-img { width: 100%; max-height: 400px; object-fit: contain; border: 1px solid #ddd; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #eee; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .high-risk { color: red; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h2 style="margin:0;">MedTriage General Hospital</h2><p style="margin:5px 0; color:#666;">Radiology Department</p></div>
            <div style="text-align:right;"><p><strong>Date:</strong> ${result.analysisDate}</p></div>
          </div>
          <div class="patient-info">
            <p><strong>Patient Name:</strong> ${result.patientName}</p>
            <p><strong>Scan Type:</strong> Chest X-Ray (PA View)</p>
          </div>
          <h1>AI Analysis Report</h1>
          <img src="${result.imageBase64}" class="scan-img" />
          <h3>Detailed Findings</h3>
          <table>
            <tr><th>Condition</th><th>Probability Score</th><th>Status</th></tr>
            ${result.findings.map(f => `
              <tr>
                <td>${f.name}</td>
                <td>${f.score.toFixed(1)}%</td>
                <td class="${f.score > 50 ? 'high-risk' : ''}">${f.score > 50 ? 'DETECTED' : 'Normal'}</td>
              </tr>
            `).join('')}
          </table>
          <div class="footer"><p>Generated by MedTriage AI System.</p></div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) { Alert.alert("Error", "Could not generate PDF"); }
  };

  const handleTermPress = (term: string) => {
    const desc = GLOSSARY[term] || "No definition available.";
    setSelectedTerm({ name: term, desc });
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* SCROLLVIEW FOR CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>MedTriage AI</Text>
          <View style={styles.secureBadge}><Text style={styles.secureText}>LIVE</Text></View>
        </View>

        {/* UPLOAD CARD */}
        <View style={styles.card}>
          <Text style={styles.label}>Patient Scan</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload}>
            <Text style={styles.uploadText}>{fileName ? "Change File" : "Select DICOM File"}</Text>
          </TouchableOpacity>
          {fileName && <Text style={styles.fileName}>{fileName}</Text>}
        </View>

        {loading && <ActivityIndicator size="large" color={theme.tint} style={{ marginVertical: 20 }} />}

        {/* RESULTS */}
        {result && (
          <View style={styles.resultContainer}>
            
            <Text style={styles.sectionTitle}>Scan Preview</Text>
            <TouchableOpacity onPress={() => setZoomVisible(true)} activeOpacity={0.9}>
              <Image source={{ uri: result.imageBase64 }} style={styles.xrayImage} resizeMode="contain" />
              <View style={styles.zoomIconOverlay}><Text style={{ color: 'white', fontSize: 20 }}>🔍</Text></View>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Patient:</Text>
              <Text style={styles.infoValue}>{result.patientName}</Text>
              <Text style={styles.infoLabel}>Risk:</Text>
              <Text style={{ fontWeight: 'bold', color: result.findings[0].score > 50 ? theme.danger : theme.success }}>
                {result.findings[0].score > 50 ? "HIGH" : "LOW"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>AI Findings (Tap for Info)</Text>
            {result.findings.map((item, index) => (
              <TouchableOpacity key={index} onPress={() => handleTermPress(item.name)} activeOpacity={0.7}>
                <View style={styles.findingRow}>
                   <View style={{flexDirection: 'row', alignItems: 'center', width: 110}}>
                      <Text style={styles.diseaseName}>{item.name}</Text>
                      <Text style={{color: theme.tint, marginLeft: 4, fontSize: 12}}>ⓘ</Text>
                   </View>
                   <View style={styles.progressBarBg}>
                     <View style={{ ...styles.progressBarFill, width: `${item.score}%`, backgroundColor: item.score > 50 ? theme.danger : theme.success }} />
                   </View>
                   <Text style={styles.scoreText}>{item.score.toFixed(1)}%</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.shareBtn} onPress={generatePDF}>
              <Text style={styles.shareBtnText}>📄 Share Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* GLOSSARY MODAL (Outside ScrollView) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{selectedTerm?.name}</Text>
            <Text style={styles.modalText}>{selectedTerm?.desc}</Text>
            <Pressable style={[styles.button, {backgroundColor: theme.tint}]} onPress={() => setModalVisible(false)}>
              <Text style={styles.textStyle}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ZOOM VIEWER */}
      {result && (
        <ImageViewing 
          images={[{ uri: result.imageBase64 }]} 
          imageIndex={0} 
          visible={zoomVisible} 
          onRequestClose={() => setZoomVisible(false)} 
          swipeToCloseEnabled={true} 
          doubleTapToZoomEnabled={true} 
        />
      )}
    </SafeAreaView>
  );
}

// --- DYNAMIC STYLES ---
const getStyles = (theme: typeof ThemeColors.light, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 20, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: '800', color: theme.primary },
  secureBadge: { backgroundColor: theme.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: theme.success },
  secureText: { color: theme.success, fontSize: 10, fontWeight: 'bold' },
  
  card: { width: '100%', backgroundColor: theme.card, padding: 20, borderRadius: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 14, color: theme.subText, marginBottom: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  uploadBtn: { backgroundColor: isDark ? '#333' : '#e3f2fd', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.tint, borderStyle: 'dashed' },
  uploadText: { color: theme.tint, fontWeight: '600' },
  fileName: { marginTop: 10, textAlign: 'center', color: theme.subText, fontStyle: 'italic', fontSize: 12 },

  resultContainer: { width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 20, marginBottom: 10 },
  xrayImage: { width: '100%', height: 300, backgroundColor: 'black', borderRadius: 10 },
  zoomIconOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  
  infoCard: { flexDirection: 'row', backgroundColor: theme.card, padding: 15, borderRadius: 10, marginTop: 10, justifyContent: 'space-around', borderColor: theme.border, borderWidth: 1 },
  infoLabel: { fontWeight: 'bold', color: theme.subText },
  infoValue: { color: theme.text },

  findingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 15, marginBottom: 8, borderRadius: 8, borderColor: theme.border, borderWidth: 1 },
  diseaseName: { fontSize: 14, fontWeight: '500', color: theme.text },
  progressBarBg: { flex: 1, height: 8, backgroundColor: theme.border, borderRadius: 5, marginHorizontal: 10 },
  progressBarFill: { height: '100%', borderRadius: 5 },
  scoreText: { width: 45, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: theme.subText },
  
  shareBtn: { backgroundColor: theme.primary, padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  shareBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  centeredView: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { margin: 20, backgroundColor: theme.card, borderRadius: 20, padding: 35, alignItems: "center", width: '85%', shadowColor: "#000", elevation: 5 },
  modalTitle: { marginBottom: 15, textAlign: "center", fontSize: 20, fontWeight: "bold", color: theme.primary },
  modalText: { marginBottom: 25, textAlign: "center", fontSize: 16, color: theme.subText, lineHeight: 24 },
  button: { borderRadius: 20, padding: 10, elevation: 2, paddingHorizontal: 30 },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" }
});