# Database Architecture Diagrams

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                    Event Management System                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)  │  Backend (Node.js)  │  Mobile App (React)  │
└────────────────────┴─────────────────────┴─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   API Gateway     │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐    ┌───────▼────────┐    ┌───────▼────────┐
│   PostgreSQL   │    │    MongoDB     │    │     Redis      │
│  (Structured   │    │ (Unstructured  │    │   (Caching)    │
│    Data)       │    │     Data)      │    │                │
└────────────────┘    └────────────────┘    └────────────────┘
```

## PostgreSQL Schema Relationships

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │ Categories  │    │   Events    │
│             │    │             │    │             │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ email       │    │ name        │    │ title       │
│ name        │    │ description │    │ description │
│ role        │    │ color       │    │ start_time  │
│ phone       │    │ icon        │    │ end_time    │
│ avatar_url  │    │             │    │ location    │
│ created_at  │    │             │    │ created_by  │
└─────────────┘    └─────────────┘    │ category_id │
        │                   │         │ status      │
        │                   │         │ max_partic  │
        │                   └─────────┤ avg_rating  │
        │                             │ total_rat   │
        │                             └─────────────┘
        │                                     │
        │                                     │
        │                             ┌───────▼────────┐
        │                             │  Participants  │
        │                             │                │
        │                             │ id (PK)        │
        │                             │ user_id (FK)   │
        │                             │ event_id (FK)  │
        │                             │ qr_code        │
        │                             │ joined_at      │
        │                             │ checked_in     │
        │                             │ check_in_time  │
        │                             └────────────────┘
        │                                     │
        │                                     │
        │                             ┌───────▼────────┐
        │                             │    Ratings     │
        │                             │                │
        │                             │ id (PK)        │
        │                             │ user_id (FK)   │
        │                             │ event_id (FK)  │
        │                             │ rating         │
        │                             │ review         │
        │                             │ created_at     │
        │                             └────────────────┘
        │
        │
┌───────▼────────┐    ┌─────────────┐    ┌─────────────┐
│ Notifications  │    │User Sessions│    │ Audit Logs  │
│                │    │             │    │             │
│ id (PK)        │    │ id (PK)     │    │ id (PK)     │
│ user_id (FK)   │    │ user_id (FK)│    │ user_id (FK)│
│ title          │    │ token       │    │ action      │
│ message        │    │ expires_at  │    │ table_name  │
│ type           │    │ created_at  │    │ record_id   │
│ is_read        │    │             │    │ old_values  │
│ related_event  │    │             │    │ new_values  │
└────────────────┘    └─────────────┘    └─────────────┘
```

## MongoDB Collections Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │    Comments     │    │User Activities  │    │Event Analytics│ │
│  │                 │    │                 │    │              │ │
│  │ _id             │    │ _id             │    │ _id          │ │
│  │ eventId         │    │ userId          │    │ eventId      │ │
│  │ userId          │    │ activityType    │    │ date         │ │
│  │ content         │    │ eventId         │    │ metrics      │ │
│  │ parentId        │    │ metadata        │    │ demographics │ │
│  │ isHidden        │    │ timestamp       │    │ traffic      │ │
│  │ likes/dislikes  │    │                 │    │              │ │
│  │ replies[]       │    │                 │    │              │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │  System Logs    │    │Notifications    │    │Search Index  │ │
│  │                 │    │     Queue       │    │              │ │
│  │ _id             │    │ _id             │    │ _id          │ │
│  │ level           │    │ userId          │    │ eventId      │ │
│  │ message         │    │ type            │    │ title        │ │
│  │ service         │    │ template        │    │ description  │ │
│  │ userId          │    │ data            │    │ location     │ │
│  │ eventId         │    │ priority        │    │ category     │ │
│  │ stack           │    │ status          │    │ tags[]       │ │
│  │ metadata        │    │ scheduledAt     │    │ searchText   │ │
│  │ timestamp       │    │ attempts        │    │ startTime    │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │User Preferences │    │ File Uploads    │                    │
│  │                 │    │                 │                    │
│  │ _id             │    │ _id             │                    │
│  │ userId          │    │ userId          │                    │
│  │ preferences     │    │ eventId         │                    │
│  │   notifications │    │ fileName        │                    │
│  │   privacy       │    │ originalName    │                    │
│  │   display       │    │ mimeType        │                    │
│  │   interests[]   │    │ size            │                    │
│  │   locations[]   │    │ url             │                    │
│  │ updatedAt       │    │ metadata        │                    │
│  └─────────────────┘    │ status          │                    │
│                         │ createdAt       │                    │
│                         └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   API       │    │  Database   │
│  Request    │───▶│  Gateway    │───▶│   Layer     │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           │                   │
                           ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ Business    │    │ PostgreSQL  │
                   │ Logic       │◀───│ (Structured │
                   │ Layer       │    │   Data)     │
                   └─────────────┘    └─────────────┘
                           │
                           │
                           ▼
                   ┌─────────────┐
                   │ MongoDB     │
                   │ (Unstructured│
                   │   Data)     │
                   └─────────────┘
```

## Query Patterns

### Read Operations
```
┌─────────────┐
│   Client    │
│   Query     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Cache     │    │ PostgreSQL  │    │ MongoDB     │
│  (Redis)    │◀───│   Views     │◀───│ Collections │
└─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

### Write Operations
```
┌─────────────┐
│   Client    │
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Validation  │
│ & Business  │
│   Logic     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │ MongoDB     │
│ (ACID)      │    │ (Fast Writes│
│             │    │  & Logs)    │
└─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

## Indexing Strategy

### PostgreSQL Indexes
```
┌─────────────┐
│    Users    │
│             │
│ idx_email   │
│ idx_role    │
└─────────────┘

┌─────────────┐
│   Events    │
│             │
│ idx_created │
│ idx_status  │
│ idx_start   │
│ idx_category│
└─────────────┘

┌─────────────┐
│Participants │
│             │
│ idx_user    │
│ idx_event   │
│ idx_qr      │
└─────────────┘
```

### MongoDB Indexes
```
┌─────────────┐
│  Comments   │
│             │
│ idx_eventId │
│ idx_userId  │
│ idx_created │
│ idx_parent  │
└─────────────┘

┌─────────────┐
│Activities   │
│             │
│ idx_user    │
│ idx_type    │
│ idx_time    │
│ idx_event   │
└─────────────┘

┌─────────────┐
│Search Index │
│             │
│ idx_text    │
│ idx_category│
│ idx_status  │
│ idx_time    │
└─────────────┘
```

## Backup Strategy

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │ MongoDB     │    │   Redis     │
│   Backup    │    │   Backup    │    │   Backup    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Daily     │    │   Daily     │    │   Daily     │
│  Full Dump  │    │  Mongodump  │    │  RDB File   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Cloud      │    │  Cloud      │    │  Cloud      │
│  Storage    │    │  Storage    │    │  Storage    │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Monitoring                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │ MongoDB     │  │   Redis     │             │
│  │   Metrics   │  │   Metrics   │  │   Metrics   │             │
│  │             │  │             │  │             │             │
│  │ Connections │  │ Connections │  │ Memory      │             │
│  │ Query Time  │  │ Operations  │  │ Hit Rate    │             │
│  │ CPU Usage   │  │ Index Usage │  │ Commands    │             │
│  │ Memory      │  │ Memory      │  │ Connections │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Alerts    │  │   Logs      │  │  Analytics  │             │
│  │             │  │             │  │             │             │
│  │ High CPU    │  │ Error Logs  │  │ Query Stats │             │
│  │ Slow Query  │  │ Access Logs │  │ User Stats  │             │
│  │ Connection  │  │ Audit Logs  │  │ Event Stats │             │
│  │ Memory      │  │ System Logs │  │ Performance │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```
