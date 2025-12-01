import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Disease {
  name: string;
  score: number;
}

interface ApiResult {
  patientName: string;
  analysisDate: string;
  findings: Disease[];
  imageBase64: string;
}

export default function App() {
  const API_URL = "http://10.119.82.86:5000/api/analysis";

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const pickAndUpload = async () => {
    try {
      const doc = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (doc.canceled) return;

      const file = doc.assets[0];
      setFileName(file.name);
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      // @ts-ignore
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: "application/dicom",
      });

      console.log("Uploading...");
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Server Error");

      setResult(json);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>MedTriage AI</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Patient Scan</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload}>
          <Text style={styles.uploadText}>
            {fileName ? "Change File" : "Select DICOM File"}
          </Text>
        </TouchableOpacity>
        {fileName && <Text style={styles.fileName}>{fileName}</Text>}
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#2196f3"
          style={{ marginVertical: 20 }}
        />
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionTitle}>Scan Preview</Text>
          <Image
            source={{ uri: result.imageBase64 }}
            style={styles.xrayImage}
            resizeMode="contain"
          />

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Patient:</Text>
            <Text style={styles.infoValue}>{result.patientName}</Text>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{result.analysisDate}</Text>
          </View>

          <Text style={styles.sectionTitle}>AI Findings</Text>
          {result.findings.map((item, index) => (
            <View key={index} style={styles.findingRow}>
              <Text style={styles.diseaseName}>{item.name}</Text>

              <View style={styles.progressBarBg}>
                <View
                  style={{
                    ...styles.progressBarFill,
                    width: `${item.score}%`,
                    backgroundColor: item.score > 50 ? "#ff4444" : "#4caf50",
                  }}
                />
              </View>

              <Text style={styles.scoreText}>{item.score.toFixed(1)}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    flexGrow: 1,
    alignItems: "center",
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a237e",
    marginBottom: 20,
    marginTop: 40,
  },

  card: {
    width: "100%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textTransform: "uppercase",
    fontWeight: "bold",
  },

  uploadBtn: {
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2196f3",
    borderStyle: "dashed",
  },
  uploadText: { color: "#1565c0", fontWeight: "600", fontSize: 16 },
  fileName: {
    marginTop: 10,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },

  resultContainer: { width: "100%" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },

  xrayImage: {
    width: "100%",
    height: 300,
    backgroundColor: "black",
    borderRadius: 10,
  },

  infoCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  infoLabel: {
    fontWeight: "bold",
    color: "#555",
    marginRight: 5,
    width: "20%",
  },
  infoValue: { marginRight: 15, color: "#333", width: "25%" },

  findingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
  },
  diseaseName: { width: 100, fontSize: 15, fontWeight: "500", color: "#333" },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginHorizontal: 10,
  },
  progressBarFill: { height: "100%", borderRadius: 5 },
  scoreText: {
    width: 50,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
  },
});
