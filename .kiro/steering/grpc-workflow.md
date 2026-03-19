---
inclusion: manual
---

# gRPC Guide - Методы + Шаблоны

## 📋 Чеклист добавления gRPC метода

### 1️⃣ Proto контракт
```protobuf
service ServiceName {
  rpc NewMethod(NewMethodRequest) returns (NewMethodResponse);
}

message NewMethodRequest {
  string id = 1;
}

message NewMethodResponse {
  Item item = 1;
}
```

**Команда:** `cd contract && task generate`

**⚠️ КРИТИЧНО: Сразу после генерации проверь компиляцию!**
```bash
# Backend
cd backend && go build -o /dev/null ./cmd/server

# Frontend
cd frontend && yarn type-check
```

Если есть ошибки компиляции - исправь их СРАЗУ, не переходи к следующим шагам!

### 2️⃣ Backend Storage
```go
func (s *Storage) NewMethod(ctx context.Context, id string) (*models.Item, error) {
    var item models.Item
    err := s.db.WithContext(ctx).First(&item, "id = ?", id).Error
    if err != nil {
        return nil, err
    }
    return &item, nil
}
```

### 3️⃣ Backend Service
```go
func (s *Service) NewMethod(ctx context.Context, id string) (*models.Item, error) {
    if id == "" {
        return nil, ErrInvalidID
    }
    
    item, err := s.storage.NewMethod(ctx, id)
    if err != nil {
        s.log.Error("failed", slog.String("error", err.Error()))
        return nil, err
    }
    
    return item, nil
}
```

### 4️⃣ Backend Handler
```go
func (s *API) NewMethod(ctx context.Context, req *pb.NewMethodRequest) (*pb.NewMethodResponse, error) {
    if err := s.validateServer(); err != nil {
        return nil, err
    }
    
    if err := validateRequiredFields(map[string]string{
        "id": req.GetId(),
    }); err != nil {
        return nil, err
    }
    
    ctx, cancel, err := withTimeout(ctx, 5*time.Second)
    if err != nil {
        return nil, err
    }
    defer cancel()
    
    item, err := s.service.NewMethod(ctx, req.GetId())
    if err != nil {
        s.log.Error("failed", slog.String("error", err.Error()))
        return nil, status.Error(codes.Internal, "operation failed")
    }
    
    return &pb.NewMethodResponse{Item: s.itemToProto(item)}, nil
}
```

### 5️⃣ Backend Auth (если публичный)
```go
// internal/lib/interceptors/auth.go
var publicMethods = map[string]bool{
    "/service.Service/NewMethod": true,  // Добавить сюда
}
```

### 6️⃣ Frontend Proto Wrapper (КРИТИЧНО!)
```typescript
// frontend/src/shared/api/generated/user/user_pb_wrapper.ts

// 1. Добавить проверку классов
if (!proto.NewMethodRequest) {
  throw new Error('Proto class NewMethodRequest not found');
}
if (!proto.NewMethodResponse) {
  throw new Error('Proto class NewMethodResponse not found');
}

// 2. Добавить экспорты
export const NewMethodRequest = proto.NewMethodRequest;
export const NewMethodResponse = proto.NewMethodResponse;
```

**⚠️ БЕЗ ЭТОГО ШАГА gRPC клиент не сможет загрузить Response класс!**

### 6.5️⃣ Frontend vite.config.ts (КРИТИЧНО для НОВОГО сервиса!)

**Если добавляешь НОВЫЙ proto сервис (не метод в существующий):**

```typescript
// frontend/vite.config.ts → protobufPlugin() → protoNamespace

// Добавить namespace нового сервиса:
const protoNamespace = { auth: {}, user: {}, admin: {}, newservice: {} };
```

**⚠️ БЕЗ ЭТОГО ШАГА:** `Cannot set properties of undefined (setting 'NewClass')` при загрузке proto!

**Подробности о причинах и диагностике:** см. `#lessons-learned` → "Proto namespace в vite.config.ts"

### 7️⃣ Frontend gRPC Client (4 шага)
```typescript
// frontend/src/shared/lib/grpc/grpc-client.ts

// 1. Добавить метод в METHODS
const METHODS = {
  // ...
  NEW_METHOD: 'NewMethod',  // Добавить
} as const;

// 2. Добавить Response класс в ALLOWED_RESPONSE_CLASSES
const ALLOWED_RESPONSE_CLASSES = new Set([
  // ...
  'NewMethodResponse',  // Добавить
]);

// 3. Добавить метод в grpcClient
export const grpcClient = {
  user: {
    // ...
    newMethod: createUserMethod(METHODS.NEW_METHOD, 'NewMethodResponse'),
  },
};

// 4. Если публичный - добавить в publicMethods (в grpcCall)
const publicMethods: AllowedMethod[] = [
  METHODS.LOGIN, 
  METHODS.NEW_METHOD,  // Добавить если публичный
];
```

### 8️⃣ Frontend RTK Query
```typescript
export const api = api.injectEndpoints({
  endpoints: (build) => ({
    newMethod: build.query<DTOItem, string>({
      queryFn: async (id) => {
        const req = new service.NewMethodRequest();
        req.setId(id);
        
        const res = await grpcClient.service.newMethod(req, {});
        return { data: res.item };
      },
      providesTags: (result, error, id) => [
        { type: 'Item', id },
        { type: 'Item', id: 'LIST' }
      ]
    })
  })
});

export const { useNewMethodQuery } = api;
```

## 🔧 Шаблоны кода

### Backend Storage
```go
func (s *Storage) GetItem(ctx context.Context, id string) (*models.Item, error) {
    var item models.Item
    
    err := s.db.WithContext(ctx).
        Preload("Relations").
        First(&item, "id = ?", id).Error
    
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, ErrNotFound
        }
        return nil, err
    }
    
    return &item, nil
}

func (s *Storage) SaveItem(ctx context.Context, item *models.Item) error {
    return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        if item.ID == "" {
            return tx.Create(item).Error
        }
        return tx.Save(item).Error
    })
}
```

### Backend Service
```go
func (s *Service) GetItem(ctx context.Context, id string) (*models.Item, error) {
    if id == "" {
        return nil, ErrInvalidID
    }
    
    item, err := s.storage.GetItem(ctx, id)
    if err != nil {
        s.log.Error("failed to get item", 
            slog.String("id", id), 
            slog.String("error", err.Error()))
        return nil, err
    }
    
    return item, nil
}
```

### Backend Converter
```go
func (s *API) itemToProto(item *models.Item) *pb.Item {
    if item == nil {
        return nil
    }
    
    return &pb.Item{
        Id:          item.ID,
        Name:        item.Name,
        Description: item.Description,
        CreatedAt:   item.CreatedAt.Unix(),
    }
}

func (s *API) protoToItem(req *pb.CreateItemRequest) *models.Item {
    return &models.Item{
        Name:        req.GetName(),
        Description: req.GetDescription(),
    }
}
```

### Frontend RTK Query Mutation
```typescript
updateItem: build.mutation<DTOItem, { id: string; name: string }>({
  queryFn: async ({ id, name }) => {
    const req = new service.UpdateItemRequest();
    req.setId(id);
    req.setName(name);
    
    const res = await grpcClient.service.updateItem(req, {});
    return { data: res.item };
  },
  async onQueryStarted(payload, { dispatch, queryFulfilled }) {
    // Оптимистичное обновление
    const patch = dispatch(
      api.util.updateQueryData('getItem', payload.id, (draft) => {
        Object.assign(draft, payload);
      })
    );
    
    try {
      await queryFulfilled;
    } catch {
      patch.undo();
    }
  },
  invalidatesTags: (result, error, { id }) => [
    { type: 'Item', id }
  ]
})
```

## 📝 Proto шаблоны

### Service Definition
```protobuf
service ItemService {
  rpc GetItem(GetItemRequest) returns (GetItemResponse);
  rpc ListItems(ListItemsRequest) returns (ListItemsResponse);
  rpc CreateItem(CreateItemRequest) returns (CreateItemResponse);
  rpc UpdateItem(UpdateItemRequest) returns (UpdateItemResponse);
  rpc DeleteItem(DeleteItemRequest) returns (DeleteItemResponse);
}
```

### Message Definition
```protobuf
message Item {
  string id = 1;
  string name = 2;
  string description = 3;
  repeated string tags = 4;
  int64 created_at = 5;
  int64 updated_at = 6;
}

message GetItemRequest {
  string id = 1;
}

message GetItemResponse {
  Item item = 1;
}

message ListItemsRequest {
  int32 page = 1;
  int32 limit = 2;
  string search = 3;
}

message ListItemsResponse {
  repeated Item items = 1;
  int32 total = 2;
}
```

## 🚨 Частые ошибки

1. **`failed to unmarshal`** → Stub файлы вместо сгенерированных proto!
2. **Забыли user_pb_wrapper.ts** → Response класс не загружается, метод молча не работает
3. **Забыли deserializer** → Error deserializing response
4. **Забыли publicMethods (backend)** → Unauthenticated 401, ответ 0 bytes
5. **Забыли publicMethods (frontend)** → Попытка refresh токена для публичного метода
6. **Не обновили интерфейс** → Compilation error
7. **Нет context timeout** → Запросы висят
8. **DELETE ALL + INSERT** → Потеря ID, неэффективность
9. **`Cannot set properties of undefined (setting 'ClassName')`** → Namespace нового сервиса не добавлен в vite.config.ts (см. шаг 6.5)

## ✅ Финальная проверка

- [ ] Proto сгенерирован (не stub!)
- [ ] Backend компилируется и запускается
- [ ] Frontend компилируется и запускается
- [ ] **Proto wrapper обновлён** (user_pb_wrapper.ts)
- [ ] Deserializer добавлен (ALLOWED_RESPONSE_CLASSES)
- [ ] Auth обновлен (если нужно) - backend auth.go + frontend publicMethods
- [ ] Метод работает через UI
- [ ] Ошибки обрабатываются

## 🎯 Best Practices

1. **Context timeout** везде (5-10s)
2. **Валидация** входных данных в handler
3. **Логирование** ошибок с контекстом
4. **Специфичные теги** RTK Query
5. **Upsert** вместо delete all + insert
6. **Nil checks** везде
7. **Тестирование** через UI перед коммитом

## 🔒 Security Checklist (при добавлении метода)

### Frontend
- [ ] **Proto wrapper обновлён** (user_pb_wrapper.ts - проверка + экспорт)
- [ ] Метод добавлен в `METHODS`
- [ ] Response класс добавлен в `ALLOWED_RESPONSE_CLASSES`
- [ ] Если публичный - добавлен в `publicMethods` (grpc-client.ts)
- [ ] Request timeout (30s) работает автоматически
- [ ] Generic error messages (не раскрывать детали)

### Backend
- [ ] Валидация входных данных
- [ ] Context timeout (5-10s)
- [ ] Логирование ошибок
- [ ] Generic error messages клиенту
- [ ] Если публичный - добавлен в `publicMethods` (auth.go)
