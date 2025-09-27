// MongoDB Seed Data
// Dữ liệu mẫu cho MongoDB collections

import { ObjectId } from 'mongodb';

// Comments data
const commentsData = [
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440001",
    userId: "650e8400-e29b-41d4-a716-446655440002",
    content: "Workshop rất hay! Cảm ơn anh đã tổ chức",
    parentId: null,
    isHidden: false,
    likes: 5,
    dislikes: 0,
    createdAt: new Date("2024-02-15T18:30:00+07:00"),
    updatedAt: new Date("2024-02-15T18:30:00+07:00"),
    replies: [
      {
        _id: new ObjectId(),
        userId: "650e8400-e29b-41d4-a716-446655440001",
        content: "Cảm ơn bạn đã tham gia!",
        isHidden: false,
        likes: 2,
        dislikes: 0,
        createdAt: new Date("2024-02-15T19:00:00+07:00"),
        updatedAt: new Date("2024-02-15T19:00:00+07:00")
      }
    ]
  },
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440001",
    userId: "650e8400-e29b-41d4-a716-446655440003",
    content: "Khi nào có workshop tiếp theo vậy anh?",
    parentId: null,
    isHidden: false,
    likes: 3,
    dislikes: 0,
    createdAt: new Date("2024-02-15T20:00:00+07:00"),
    updatedAt: new Date("2024-02-15T20:00:00+07:00"),
    replies: []
  },
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440002",
    userId: "650e8400-e29b-41d4-a716-446655440001",
    content: "AI workshop rất bổ ích, speaker giỏi quá!",
    parentId: null,
    isHidden: false,
    likes: 8,
    dislikes: 0,
    createdAt: new Date("2024-02-20T19:00:00+07:00"),
    updatedAt: new Date("2024-02-20T19:00:00+07:00"),
    replies: []
  }
];

// User activities data
const userActivitiesData = [
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440001",
    activityType: "login",
    eventId: null,
    metadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      location: {
        latitude: 21.0285,
        longitude: 105.8542,
        address: "Hà Nội, Việt Nam"
      },
      device: {
        type: "desktop",
        os: "Windows 10",
        browser: "Chrome"
      }
    },
    timestamp: new Date("2024-02-15T08:00:00+07:00")
  },
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440002",
    activityType: "view_event",
    eventId: "750e8400-e29b-41d4-a716-446655440001",
    metadata: {
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
      location: {
        latitude: 21.0285,
        longitude: 105.8542,
        address: "Hà Nội, Việt Nam"
      },
      device: {
        type: "mobile",
        os: "iOS 15.0",
        browser: "Safari"
      }
    },
    timestamp: new Date("2024-02-15T09:30:00+07:00")
  },
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440003",
    activityType: "join_event",
    eventId: "750e8400-e29b-41d4-a716-446655440001",
    metadata: {
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Android 11; Mobile; rv:68.0)",
      location: {
        latitude: 21.0285,
        longitude: 105.8542,
        address: "Hà Nội, Việt Nam"
      },
      device: {
        type: "mobile",
        os: "Android 11",
        browser: "Firefox"
      }
    },
    timestamp: new Date("2024-02-11T14:30:00+07:00")
  }
];

// Event analytics data
const eventAnalyticsData = [
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440001",
    date: new Date("2024-02-15"),
    metrics: {
      views: 150,
      uniqueViews: 120,
      shares: 25,
      registrations: 45,
      checkIns: 40,
      comments: 8,
      ratings: 12
    },
    demographics: {
      ageGroups: {
        "18-25": 20,
        "26-35": 15,
        "36-45": 8,
        "46-55": 2,
        "55+": 0
      },
      genders: {
        male: 30,
        female: 15,
        other: 0
      }
    },
    traffic: {
      sources: {
        direct: 60,
        social: 40,
        search: 30,
        referral: 20
      },
      devices: {
        mobile: 80,
        tablet: 15,
        desktop: 55
      }
    }
  },
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440002",
    date: new Date("2024-02-20"),
    metrics: {
      views: 200,
      uniqueViews: 180,
      shares: 35,
      registrations: 80,
      checkIns: 75,
      comments: 12,
      ratings: 25
    },
    demographics: {
      ageGroups: {
        "18-25": 25,
        "26-35": 30,
        "36-45": 15,
        "46-55": 8,
        "55+": 2
      },
      genders: {
        male: 50,
        female: 25,
        other: 5
      }
    },
    traffic: {
      sources: {
        direct: 80,
        social: 60,
        search: 40,
        referral: 20
      },
      devices: {
        mobile: 100,
        tablet: 20,
        desktop: 80
      }
    }
  }
];

// System logs data
const systemLogsData = [
  {
    _id: new ObjectId(),
    level: "info",
    message: "User logged in successfully",
    service: "auth",
    userId: "650e8400-e29b-41d4-a716-446655440001",
    eventId: null,
    stack: null,
    metadata: {
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    timestamp: new Date("2024-02-15T08:00:00+07:00")
  },
  {
    _id: new ObjectId(),
    level: "warn",
    message: "Failed login attempt",
    service: "auth",
    userId: null,
    eventId: null,
    stack: null,
    metadata: {
      ipAddress: "192.168.1.200",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      email: "invalid@example.com"
    },
    timestamp: new Date("2024-02-15T08:15:00+07:00")
  },
  {
    _id: new ObjectId(),
    level: "error",
    message: "Database connection timeout",
    service: "database",
    userId: null,
    eventId: null,
    stack: "Error: Connection timeout\n    at Database.connect (/app/db.js:45:12)",
    metadata: {
      retryCount: 3,
      timeout: 5000
    },
    timestamp: new Date("2024-02-15T09:00:00+07:00")
  }
];

// Notifications queue data
const notificationsQueueData = [
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440001",
    type: "email",
    template: "event_approved",
    data: {
      eventTitle: "Workshop React.js 2024",
      eventDate: "2024-02-15",
      eventLocation: "Tòa nhà A, Đại học Bách Khoa Hà Nội"
    },
    priority: "normal",
    status: "sent",
    scheduledAt: new Date("2024-02-10T10:00:00+07:00"),
    sentAt: new Date("2024-02-10T10:01:00+07:00"),
    attempts: 1,
    maxAttempts: 3,
    error: null,
    createdAt: new Date("2024-02-10T10:00:00+07:00")
  },
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440002",
    type: "push",
    template: "event_reminder",
    data: {
      eventTitle: "Hội thảo AI & Machine Learning",
      eventDate: "2024-02-20",
      timeRemaining: "2 hours"
    },
    priority: "high",
    status: "pending",
    scheduledAt: new Date("2024-02-20T12:00:00+07:00"),
    sentAt: null,
    attempts: 0,
    maxAttempts: 3,
    error: null,
    createdAt: new Date("2024-02-19T12:00:00+07:00")
  }
];

// Search index data
const searchIndexData = [
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440001",
    title: "Workshop React.js 2024",
    description: "Học React.js từ cơ bản đến nâng cao với các dự án thực tế",
    location: "Tòa nhà A, Đại học Bách Khoa Hà Nội",
    category: "Công nghệ",
    tags: ["react", "javascript", "frontend", "web development", "workshop"],
    startTime: new Date("2024-02-15T09:00:00+07:00"),
    endTime: new Date("2024-02-15T17:00:00+07:00"),
    isPublic: true,
    status: "approved",
    averageRating: 4.5,
    totalRatings: 12,
    participantCount: 45,
    searchText: "Workshop React.js 2024 Học React.js từ cơ bản đến nâng cao với các dự án thực tế Tòa nhà A, Đại học Bách Khoa Hà Nội Công nghệ react javascript frontend web development workshop",
    createdAt: new Date("2024-02-10T10:00:00+07:00"),
    updatedAt: new Date("2024-02-15T18:30:00+07:00")
  },
  {
    _id: new ObjectId(),
    eventId: "750e8400-e29b-41d4-a716-446655440002",
    title: "Hội thảo AI & Machine Learning",
    description: "Khám phá xu hướng AI và ứng dụng trong thực tế",
    location: "Trung tâm Hội nghị Quốc gia",
    category: "Công nghệ",
    tags: ["ai", "machine learning", "artificial intelligence", "data science", "technology"],
    startTime: new Date("2024-02-20T14:00:00+07:00"),
    endTime: new Date("2024-02-20T18:00:00+07:00"),
    isPublic: true,
    status: "approved",
    averageRating: 4.8,
    totalRatings: 25,
    participantCount: 80,
    searchText: "Hội thảo AI & Machine Learning Khám phá xu hướng AI và ứng dụng trong thực tế Trung tâm Hội nghị Quốc gia Công nghệ ai machine learning artificial intelligence data science technology",
    createdAt: new Date("2024-02-15T11:00:00+07:00"),
    updatedAt: new Date("2024-02-20T19:00:00+07:00")
  }
];

// User preferences data
const userPreferencesData = [
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440001",
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false,
        eventReminders: true,
        eventUpdates: true,
        newEvents: true
      },
      privacy: {
        showProfile: true,
        showEvents: true,
        showRatings: true
      },
      display: {
        theme: "dark",
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh"
      },
      interests: ["Công nghệ", "Giáo dục", "Kinh doanh"],
      locations: [
        {
          name: "Hà Nội",
          latitude: 21.0285,
          longitude: 105.8542,
          radius: 50
        }
      ]
    },
    updatedAt: new Date("2024-02-15T08:00:00+07:00")
  },
  {
    _id: new ObjectId(),
    userId: "650e8400-e29b-41d4-a716-446655440002",
    preferences: {
      notifications: {
        email: true,
        push: false,
        sms: true,
        eventReminders: true,
        eventUpdates: false,
        newEvents: true
      },
      privacy: {
        showProfile: false,
        showEvents: true,
        showRatings: false
      },
      display: {
        theme: "light",
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh"
      },
      interests: ["Công nghệ", "Thể thao"],
      locations: [
        {
          name: "TP.HCM",
          latitude: 10.8231,
          longitude: 106.6297,
          radius: 30
        }
      ]
    },
    updatedAt: new Date("2024-02-15T09:30:00+07:00")
  }
];

// Export all data
export {
  commentsData,
  userActivitiesData,
  eventAnalyticsData,
  systemLogsData,
  notificationsQueueData,
  searchIndexData,
  userPreferencesData
};
