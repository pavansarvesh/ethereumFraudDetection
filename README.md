# Ethereum Fraud Detection

This project has two parts:

- `backend/`: a FastAPI service that loads the fraud model and exposes a `/predict` endpoint.
- `frontend/`: a Vite + React wallet dashboard for connecting MetaMask on Sepolia and sending test ETH.

## Prerequisites

- Python 3.10+ with `pip`
- Node.js 18+ and `pnpm`
- MetaMask installed in your browser
- Sepolia test ETH if you want to use the wallet dashboard

## Project Setup

Clone the repository and move into the project folder.

```bash
git clone https://github.com/pavansarvesh/ethereumFraudDetection.git
cd ethereumFraudDetection
```

## Backend

The backend is a FastAPI app that loads `fraud_model.pkl` from the `backend/` directory. Start it from that folder so the model file is found correctly.

### 1. Create and activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the API server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

### 4. Test the endpoint

You can send a request to `/predict` with either the current feature format or the legacy wallet feature format used by the helper code.

Example request:

```bash
curl -X POST http://localhost:8000/predict \
	-H "Content-Type: application/json" \
	-d '{
		"amount": 1.2,
		"hour": 12,
		"sender_tx_count": 3,
		"receiver_tx_count": 2,
		"large_transaction": 0,
		"zero_amount": 0,
		"night_transaction": 0,
		"high_sender_activity": 0,
		"repeated_target": 0
	}'
```

## Frontend

The frontend is a React + Vite app that connects to MetaMask and works on the Sepolia network.

### 1. Install dependencies

Open a new terminal and run:

```bash
cd frontend
pnpm install
```

### 2. Start the development server

```bash
pnpm dev
```

The app will usually run at `http://localhost:5173`.

## Suggested Run Order

1. Start the backend first.
2. Start the frontend next.
3. Open the frontend in your browser and connect MetaMask.

## Notes

- The wallet UI expects MetaMask to be on the Sepolia network.
- If the backend cannot find `fraud_model.pkl`, make sure you started it from inside `backend/`.
- If you change frontend code, use `pnpm build` to verify the production build.

## Useful Commands

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
pnpm dev
pnpm build
pnpm lint
```
