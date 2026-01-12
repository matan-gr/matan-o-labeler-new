
# Enterprise Deployment Guide: CloudGov AI

This guide details the secure deployment of the CloudGov AI application to Google Cloud Run using a production-ready container pipeline.

## 1. Preparation

Ensure your file structure includes the following production files:

*   `dockerfile.txt` (Multi-stage build definition)
*   `nginx.txt` (Nginx web server configuration)
*   `dockerignore.txt` (Build context optimization)
*   `cloudbuild.yaml` (CI/CD pipeline definition)

## 2. Prerequisites

*   **Google Cloud Project** with Billing Enabled.
*   **Google Cloud SDK** (`gcloud`) installed.
*   **Gemini API Key**: Obtain a valid API key from [Google AI Studio](https://aistudio.google.com/).
*   **Permissions**: `roles/run.admin`, `roles/storage.admin`, `roles/cloudbuild.builds.editor`.

## 3. Infrastructure Setup

### Enable Required APIs
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  logging.googleapis.com
```

## 4. Deploy with Cloud Build

We use `cloudbuild.yaml` to automate the build and deployment process. This method securely injects your Gemini API key into the container environment.

### Run Build & Deploy

Replace `YOUR_GEMINI_KEY` with your actual API key and run:

```bash
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_GEMINI_API_KEY="YOUR_GEMINI_KEY" \
    .
```

**What this does:**
1.  **Builds** the React application using Node.js.
2.  **Packages** the static assets into a lightweight Nginx container.
3.  **Pushes** the image to Google Container Registry (GCR).
4.  **Deploys** the service to Cloud Run with the `GEMINI_API_KEY` environment variable set.

## 5. Verification

1.  **Check Build Status**: Visit the [Cloud Build History](https://console.cloud.google.com/cloud-build/builds) page.
2.  **Access App**: Once deployed, the service URL will be printed in the logs (e.g., `https://cloudgov-ai-xyz-uc.a.run.app`).
3.  **Health Check**: Verify the service is healthy:
    ```bash
    curl [SERVICE_URL]/healthz
    ```

## 6. Local Development (Docker)

To run the production container locally:

```bash
# Build
docker build -f dockerfile.txt -t cloudgov-ai .

# Run (Replace your-key)
docker run -p 3000:3000 -e GEMINI_API_KEY="your-key" cloudgov-ai
```

## 7. Architecture & Performance

*   **Frontend**: React 18 + Vite (Manual Chunk Splitting).
*   **Lazy Loading**: Route-based code splitting for faster initial load.
*   **Serving**: Nginx (Alpine) with Gzip compression and aggressive caching for static assets.
*   **Concurrency**: Optimized API handling with rate limiting for GCP operations.
