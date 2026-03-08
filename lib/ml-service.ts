const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

export interface MLClassification {
    label: string;
    confidence: number;
    all_predictions?: Array<{ label: string; confidence: number }>;
    similar_judgements?: Array<{
        filename: string;
        year: number | null;
        text_preview: string;
        category: string;
        source: string;
    }>;
}

export interface MLFIRAnalysis {
    success: boolean;
    incident: string;
    predicted_category: string;
    confidence: number;
    crime_type: string;
    description: string;
    primary_sections: Array<{
        section: string;
        title: string;
        description?: string;
        penalty: string;
        bailable?: boolean;
        confidence?: number;
    }>;
    secondary_sections: Array<{
        section: string;
        title: string;
        penalty: string;
    }>;
    similar_cases: Array<{
        filename: string;
        year: number | null;
        text_preview: string;
        category: string;
    }>;
    fir_draft: string;
    all_categories: Array<{ label: string; confidence: number }>;
    used_keyword_matching: boolean;
}

export interface MLModelInfo {
    model_type: string;
    num_labels: number;
    architecture: string;
    loaded: boolean;
    device: string;
    model_name: string;
    training_samples: string;
}

export interface MLHealthStatus {
    status: string;
    service: string;
    model_loaded: boolean;
    timestamp: string;
}

async function fetchML<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    try {
        const res = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });
        if (!res.ok) throw new Error(`ML Service error: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error(`ML Service request failed for ${endpoint}:`, error);
        return null;
    }
}

export async function classifyText(text: string): Promise<MLClassification | null> {
    return fetchML<MLClassification>('/predict', {
        method: 'POST',
        body: JSON.stringify({ text }),
    });
}

export async function predictFIRSections(incidentText: string): Promise<MLFIRAnalysis | null> {
    return fetchML<MLFIRAnalysis>('/predict_fir_sections', {
        method: 'POST',
        body: JSON.stringify({ incident_text: incidentText }),
    });
}

export async function getModelInfo(): Promise<MLModelInfo | null> {
    return fetchML<MLModelInfo>('/model_info');
}

export async function getMLHealth(): Promise<MLHealthStatus | null> {
    return fetchML<MLHealthStatus>('/api/health');
}

export async function getDatasetStats(): Promise<Record<string, any> | null> {
    return fetchML<Record<string, any>>('/dataset_stats');
}

export async function getAccuracyMetrics(): Promise<Record<string, any> | null> {
    return fetchML<Record<string, any>>('/accuracy');
}
