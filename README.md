# 🎮 Impostor Game

Multiplayer online igra inspirisana Among Us-om, gde igrači pokušavaju da identifikuju impostora kroz diskusiju i glasanje. Igra koristi real-time komunikaciju preko SignalR-a i omogućava praćenje istorije partija.

## 📋 Sadržaj

- [Tehnologije](#-tehnologije)
- [Arhitektura](#-arhitektura)
- [Preduslov](#-preduslov)
- [Pokretanje projekta](#-pokretanje-projekta)
- [Struktura projekta](#-struktura-projekta)
- [Opis igre](#-opis-igre)
- [API Endpoints](#-api-endpoints)

## 🛠 Tehnologije

### Backend
- **.NET 9.0** - Web API
- **SignalR** - Real-time komunikacija
- **Apache Cassandra** - NoSQL baza podataka za istoriju igara
- **Redis** - In-memory storage za lobby i game state management
- **C# 12** - Programski jezik

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool i dev server
- **TailwindCSS + DaisyUI** - Styling
- **Firebase** - Autentifikacija korisnika
- **SignalR Client** - Real-time komunikacija sa serverom
- **React Router** - Routing
- **Formik + Yup** - Forme i validacija
- **Framer Motion** - Animacije
- **Leaflet** - Mape
- **Axios** - HTTP client

### Infrastructure
- **Docker & Docker Compose** - Kontejnerizacija baza podataka

## 🏗 Arhitektura

Projekat prati **N-tier arhitekturu**:

```
┌─────────────────┐
│   Frontend      │  React SPA (Port 5173)
│   (Vite)        │
└────────┬────────┘
         │ HTTP/SignalR
         ▼
┌─────────────────┐
│  Backend.API    │  .NET Web API (Port 5000)
│  (Controllers   │
│   + SignalR     │
│   Hubs)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BusinessLayer   │  Logika igre i servisi
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DatabaseLayer   │  Repository pattern
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────┐
│Cassandra│ │Redis │
│(9042)   │ │(6379)│
└─────────┘ └──────┘
```

## ✅ Preduslov

- Node.js (v18+)
- .NET 9.0 SDK
- Docker Desktop

## 🚀 Pokretanje projekta

### 1. Pokretanje baza podataka

```bash
docker-compose up -d
```

### 2. Konfiguracija Firebase-a

`.env` fajl sa Firebase konfiguracionim parametrima poslat je kroz formu za predaju zadatka. Staviti `.env` fajl u `frontend/` folder.

### 3. Pokretanje Backend-a

```bash
cd src/Backend.API
dotnet restore
dotnet run
```

Backend: `http://localhost:5000` | Swagger: `http://localhost:5000/swagger`

### 4. Pokretanje Frontend-a

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## 📁 Struktura projekta

```
impostor-game/
│
├── docker-compose.yml           # Docker konfiguracija za baze
│
├── frontend/                    # React aplikacija
│   ├── src/
│   │   ├── components/          # React komponente
│   │   │   ├── Game.tsx         # Glavna komponenta igre
│   │   │   ├── Lobby.tsx        # Lobby/čekaonica
│   │   │   ├── Login.tsx        # Autentifikacija
│   │   │   └── game/            # Komponente specifične za igru
│   │   ├── context/             # React Context (Auth)
│   │   └── interfaces/          # TypeScript interfejsi
│   ├── package.json
│   └── vite.config.js
│
└── src/                         # Backend .NET
    ├── impostor-game.sln        # Solution fajl
    │
    ├── Backend.API/             # Web API layer
    │   ├── Controllers/         # REST API kontroleri
    │   ├── Hubs/                # SignalR hubs
    │   │   ├── GameHub.cs       # Real-time game logic
    │   │   └── LobbyHub.cs      # Lobby management
    │   └── Program.cs           # Entry point + DI konfiguracija
    │
    ├── BusinessLayer/           # Business logic
    │   └── Services/
    │       ├── GameService.cs
    │       ├── LobbyService.cs
    │       └── SecretWordService.cs
    │
    ├── CommonLayer/             # Shared code
    │   ├── DTOs/                # Data Transfer Objects
    │   ├── Enums/               # Enumeracije
    │   ├── Interfaces/          # Interfejsi
    │   └── Models/              # Domain modeli
    │
    └── DatabaseLayer/           # Data access
        ├── Repositories/        # Repository pattern implementacije
```

## 🎯 Opis igre

**Impostor Game** je multiplayer igra za 4+ igrača gde:

1. **Kreiranje sobe**: Jedan igrač kreira sobu i određuje broj rundi
2. **Lobby**: Igrači se pridružuju sobi preko koda
3. **Početak igre**: Jedan igrač je slučajno izabran kao **Impostor**
   - Impostor **NE ZNAŠ** tajnu reč
   - Ostali igrači **ZNAJU** tajnu reč
4. **Runde**:
   - Svaki igrač daje jedan **trag** (clue) za tajnu reč
   - Impostor pokušava da se uklopi bez otkrivanja
5. **Glasanje**: Igrači glasaju ko je impostor
6. **Pobeda**:
   - Igrači pobeduju ako identifikuju impostora
   - Impostor pobeduje ako ostane neotkriveno

### Faze igre

1. **INTRO** - Prikaz uloga (impostor ili ne)
2. **FIRST_CLUE** - Prvi igrač daje trag
3. **DISCUSSION** - Diskusija između rundi
4. **VOTING** - Glasanje za impostora
5. **EJECTION** - Prikaz rezultata glasanja
6. **END** - Kraj igre sa rezultatima

## 🌐 API Endpoints

### REST API

#### User Management
- `GET /api/user/{username}` - Dobavi informacije o korisniku
- `POST /api/user` - Kreiraj novog korisnika
- `GET /api/user/leaderboard` - Top igrači po poenima
- `GET /api/user/{username}/history` - Istorija igara korisnika

#### Room Management
- `GET /api/rooms` - Lista aktivnih soba
- `POST /api/rooms` - Kreiranje nove sobe
- `GET /api/rooms/{roomId}` - Informacije o sobi

#### Secret Words
- `GET /api/secretword` - Dobavi nasumičnu tajnu reč

### SignalR Hubs

#### LobbyHub (`/lobbyhub`)
- `CreateRoom(int numberOfRounds)` - Kreiraj sobu
- `JoinRoom(string roomCode, string username)` - Pridruži se sobi
- `LeaveRoom()` - Napusti sobu
- `StartGame()` - Pokreni igru (samo host)

#### GameHub (`/gamehub`)
- `SendClue(string clue)` - Pošalji trag
- `SendMessage(string message)` - Pošalji chat poruku
- `Vote(string targetUsername)` - Glasaj za igrača
- `StateEnded()` - Signalizuj da je igrač završio sa fazom

## 🗄️ Baze podataka

### Redis
Koristi se za:
- Lobby management (aktivne sobe)
- Game state (trenutno stanje igre)
- Player sessions

### Cassandra
Koristi se za:
- Istoriju igara (`game_history`)
- Event log igre (`game_events`)
- Statistiku igrača po igrama (`game_history_by_user`)

Schema se automatski kreira pri pokretanju backend-a.

##  Autori

Projekat razvijen u sklopu kursa **Napredne Baze Podataka**.

## 📄 Licenca

Projekat je napravljen za edukativne svrhe.

---

**Uživajte u igri! 🎮🚀**
