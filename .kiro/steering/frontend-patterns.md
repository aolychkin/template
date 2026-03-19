---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx,**/*.ts"
---

# Frontend Guide - React + TypeScript + gRPC-Web

## 🏗️ Архитектура (Feature-Sliced Design)

```
app → pages → widgets → features → entities → shared
```

**Правила:**
- Слои импортируют только вниз
- Public API через index.ts
- **ВСЕГДА используй абсолютные импорты через алиасы** (НЕ относительные `../../../`)

## 📦 Импорты (КРИТИЧНО)

### ✅ Правильно - абсолютные через алиасы
```typescript
import { api } from 'shared/api/base-api';
import { grpcClient } from 'shared/lib/grpc/grpc-client';
import { useLoginMutation } from 'entities/user';
import { store } from 'app/store';
```

### ❌ Неправильно - относительные пути
```typescript
import { api } from '../../../shared/api/base-api';  // НЕТ!
import { grpcClient } from '../../lib/grpc';         // НЕТ!
```

### Когда использовать относительные
Только для локальных импортов внутри одной папки:
```typescript
// pages/auth/register/ui/RegisterPage.tsx
import { PersonalInfoStep } from './PersonalInfoStep';  // ✅ OK
```

## 🔧 gRPC-Web интеграция

### Proto → Frontend
```
.proto → protoc → _pb.js + _pb.d.ts → Vite plugin → Wrapper
```

### Wrapper pattern (ОБЯЗАТЕЛЬНО)
```typescript
// shared/api/generated/service/service_pb_wrapper.ts
import './service_pb.js';

const proto = (globalThis as any).proto?.service;
if (!proto) throw new Error('Proto service not loaded');

export const GetItemRequest = proto.GetItemRequest;
export const GetItemResponse = proto.GetItemResponse;
```

**⚠️ При добавлении новых gRPC методов:**
1. Добавить проверку класса: `if (!proto.NewMethodRequest) throw new Error(...)`
2. Добавить экспорт: `export const NewMethodRequest = proto.NewMethodRequest`
3. То же для Response класса

См. полный чеклист: `#grpc-workflow`

## ⚡ RTK Query + gRPC

### Query
```typescript
export const api = createApi({
  endpoints: (build) => ({
    getItem: build.query<DTOItem, string>({
      queryFn: async (id) => {
        try {
          const req = new GetItemRequest();
          req.setId(id);
          const res = await grpcClient.service.getItem(req);
          return { data: mapResponse(res) };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      providesTags: (result, error, id) => [{ type: 'Item', id }]
    })
  })
});
```

### Mutation с оптимизмом
```typescript
updateItem: build.mutation({
  async onQueryStarted(item, { dispatch, queryFulfilled }) {
    const patch = dispatch(
      api.util.updateQueryData('getItem', item.id, (draft) => {
        Object.assign(draft, item);
      })
    );
    
    try {
      await queryFulfilled;
    } catch {
      patch.undo();
    }
  },
  invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }]
})
```

## 🎨 UI компоненты

### React.memo + useMemo
```typescript
const ItemCard = React.memo(({ item }) => {
  const tags = useMemo(() => item.tags, [item.tags]);
  
  return (
    <Card>
      <Typography>{item.title}</Typography>
      <Tags items={tags} />
    </Card>
  );
});
```

## 📁 Структура

```
src/
├── app/
│   ├── App.tsx
│   └── store.ts            # Redux store
├── pages/
│   └── ItemPage/           # Страницы
├── entities/
│   └── item/
│       ├── api/            # RTK Query endpoints
│       ├── model/          # TypeScript типы
│       └── index.ts        # Public API
└── shared/
    ├── api/generated/      # Proto wrappers
    ├── lib/grpc/           # gRPC клиент
    └── ui/                 # Переиспользуемые компоненты
```

## 🧩 Декомпозиция больших компонентов

**Когда применять:** Компонент > 300-400 строк

### Структура папки компонента

```
component-name/
├── index.ts                    # Public API (export)
├── ComponentName.tsx           # Главный компонент (композиция)
├── ComponentName.test.tsx      # Тесты
├── types.ts                    # Типы и интерфейсы
├── hooks/
│   └── useComponentLogic.ts    # Вся логика формы/состояния
└── sections/
    ├── index.ts                # Экспорт секций
    ├── SectionOne.tsx          # UI секция 1
    └── SectionTwo.tsx          # UI секция 2
```

### Правила

1. **index.ts** - только экспорт, НЕ код компонента
2. **ComponentName.tsx** - композиция секций, минимум логики (~100 строк)
3. **hooks/** - вся бизнес-логика, состояние, обработчики
4. **sections/** - чистые UI компоненты, получают данные через props

## 🔐 Auth интеграция

### Protected Routes
```typescript
<Route element={<ProtectedRoute roles={['admin']} />}>
  <Route path="/admin" element={<AdminPage />} />
</Route>
```

### Auth hooks
```typescript
const { isAuthenticated, user } = useAuth();
const { data } = useGetItemsQuery(undefined, {
  skip: !isAuthenticated
});
```

## 🛡️ Security

### gRPC Client Security
```typescript
// ✅ Request timeout (защита от DoS)
const REQUEST_TIMEOUT = 30000; // 30s
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

// ✅ Generic error messages (не раскрывать детали)
throw new Error('Invalid message format'); // НЕ: `Invalid length: ${length}`

// ✅ Whitelist валидация
const ALLOWED_RESPONSE_CLASSES = new Set(['AuthResponse', 'GetMeResponse']);

// ✅ Условное логирование (только в development)
if (config.enableDebugLogs) {
  debugLog('🔌 gRPC call:', service, method);
}
```

### XSS защита
```typescript
export function sanitizeUser(user: any): User | null {
  if (!user || typeof user !== 'object') return null;
  
  return {
    id: typeof user.id === 'string' ? user.id : '',
    email: typeof user.email === 'string' ? user.email : '',
  };
}
```

## 📊 Оптимизации

### Code Splitting (vite.config.ts)
```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-mui': ['@mui/material', '@mui/icons-material'],
  'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
  'vendor-grpc': ['google-protobuf'],
}
```

### Lazy Loading
```typescript
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));

<Suspense fallback={<ProfilePageSkeleton />}>
  <ProfilePage />
</Suspense>
```

## 🎯 Best Practices

1. **Абсолютные импорты** через алиасы (shared/, entities/, app/)
2. **Wrapper pattern** для proto (не прямой импорт _pb.js)
3. **Мемоизация** дорогих вычислений (useMemo, React.memo)
4. **Специфичные теги** RTK Query для точной инвалидации
5. **Try-catch** для внешних API (cookies, localStorage)
6. **Валидация** user структуры перед использованием
7. **Public API** через index.ts для чистых импортов
8. **Request timeout** (30s) для защиты от DoS
9. **Generic error messages** - не раскрывать внутреннюю информацию
10. **Условное логирование** - только в development

## 🔍 Отладка

### gRPC ошибки
```typescript
// Логирование response для отладки
const data = await response.arrayBuffer();
console.log('📦 Response size:', data.byteLength, 'bytes');
```

### Network tab
- gRPC запросы как POST /service.Service/Method
- Content-Type: application/grpc-web+proto
- Проверяй response headers и status
