# Customer Auto-Creation System Documentation

## 🎯 **Overview**

The GAQNO Omnichannel system automatically creates customers when conversations are initiated, ensuring comprehensive customer management across all communication channels. This system guarantees that **every person who starts a conversation is automatically added to the customer list**.

## ✅ **Current Implementation Status: FULLY FUNCTIONAL**

### **🔄 Automatic Customer Creation Triggers**

#### **1. Incoming Messages (WhatsApp, Telegram, etc.)**
```typescript
// File: src/messaging/core/inbox-ingestion.service.ts
// Lines 66-71
const customer = await this.customersService.findOrCreateByChannelIdentity(
  tenantId,
  channel.id,
  message.from,                    // Phone number, user ID, etc.
  message.context?.profileName ?? message.from  // Display name from profile
);
```

**Trigger**: Any incoming message from any channel
**Result**: Customer automatically created if not exists

#### **2. Outbound Conversations (Agent Initiated)**
```typescript
// File: src/conversations/conversations.service.ts
// Lines 400-405
const customer = await this.customersService.findOrCreateByChannelIdentity(
  tenantId,
  channel.id,
  to,           // Recipient number
  to            // Display name
);
```

**Trigger**: Agent starts new conversation
**Result**: Customer automatically created if not exists

#### **3. Customer Identity Resolution**
```typescript
// File: src/customers/customers.service.ts
// Lines 17-61
async findOrCreateByChannelIdentity(
  tenantId: string,
  channelId: string,
  externalId: string,    // Phone number, user ID
  displayName?: string    // Profile name
) {
  // 1. Check if customer exists by channel identity
  // 2. If exists: Update last seen timestamp
  // 3. If not exists: Create new customer
  // 4. Link customer to channel identity
  // 5. Log creation for analytics
}
```

## 🚀 **Enhanced Features Added**

### **📊 Customer Analytics**
- **Total Customers Count**
- **New Customers This Month**
- **Active Customers This Week**
- **Customer Source Tracking**

### **🔍 Enhanced Customer Metadata**
```typescript
metadata: {
  source: 'auto_created',           // How customer was created
  channel: 'channel_id',           // Which channel
  firstContactAt: '2024-01-01...', // First interaction
  originalExternalId: 'phone_number', // Original contact ID
  lastSeenAt: '2024-01-01...',   // Last interaction
  profilePictureUrl: 'https://...',  // Profile picture (WhatsApp)
}
```

### **📈 Customer Activity Tracking**
- **Last Seen Timestamp**: Updated on every interaction
- **First Contact Date**: Captured at creation
- **Channel Identity Mapping**: Multiple channels per customer
- **Profile Enrichment**: Automatic profile picture fetching

## 🌐 **Multi-Channel Support**

### **✅ Supported Channels**
| Channel | Auto-Creation | Identity Source | Profile Enrichment |
|----------|----------------|----------------|-------------------|
| **WhatsApp** | ✅ | Phone Number | Profile Picture, Name |
| **Telegram** | ✅ | User ID | Username, Name |
| **Web Chat** | ✅ | Email/ID | Name, Email |
| **SMS** | ✅ | Phone Number | Name (if available) |

### **🔄 Identity Resolution Logic**
```typescript
// Customer can have multiple channel identities
Customer: {
  id: "customer_123",
  displayName: "John Doe",
  identities: [
    { channelId: "whatsapp_1", externalId: "+5511999998888" },
    { channelId: "telegram_1", externalId: "123456789" },
    { channelId: "webchat_1", externalId: "john@email.com" }
  ]
}
```

## 📋 **API Endpoints**

### **Customer Management**
```http
GET    /api/customers              # List all customers
GET    /api/customers/stats         # Customer statistics
GET    /api/customers/:id          # Get customer details
PATCH  /api/customers/:id          # Update customer
```

### **Customer Statistics Response**
```json
{
  "totalCustomers": 1250,
  "newCustomersThisMonth": 45,
  "activeCustomersThisWeek": 89
}
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Enable/disable auto-creation (default: enabled)
CUSTOMER_AUTO_CREATION_ENABLED=true

# Profile picture fetching (WhatsApp)
WHATSAPP_PROFILE_PICTURE_FETCH_ENABLED=true

# Customer analytics tracking
CUSTOMER_ANALYTICS_ENABLED=true
```

### **Service Configuration**
```typescript
// No additional configuration required
// Auto-creation works out-of-the-box
```

## 📊 **Monitoring & Logging**

### **Customer Creation Events**
```log
[CustomersService] Auto-created customer abc-123 for channel whatsapp-1 with external ID +5511999998888
[CustomersService] Updated last seen for customer abc-123
[CustomersService] Enriched customer profile with picture URL
```

### **Analytics Events**
```log
[CustomersService] Customer stats: total=1250, new_this_month=45, active_this_week=89
[CustomersService] Channel identity resolution: customer=abc-123, channels=3
```

## 🎯 **Business Benefits**

### **✅ Automatic Customer Capture**
- **No Manual Entry**: Every contact becomes a customer
- **Complete Coverage**: No lost conversations
- **Immediate Availability**: Real-time customer creation

### **📈 Data-Driven Insights**
- **Customer Growth Metrics**: Track acquisition over time
- **Channel Performance**: Most effective channels
- **Engagement Analytics**: Active vs inactive customers

### **🔗 Unified Customer View**
- **Multi-Channel Identity**: One customer, multiple channels
- **Conversation History**: Complete interaction timeline
- **Profile Enrichment**: Automatic data collection

## 🚀 **Usage Examples**

### **Scenario 1: First Contact via WhatsApp**
1. **Customer sends message** to WhatsApp number
2. **System checks** if customer exists by phone number
3. **Auto-creates customer** with phone number as identity
4. **Fetches profile picture** from WhatsApp API
5. **Creates conversation** linked to new customer
6. **Updates customer stats** (new customer this month)

### **Scenario 2: Existing Customer Contacts via Different Channel**
1. **Customer sends message** via Telegram
2. **System finds existing customer** by matching patterns
3. **Adds new channel identity** to existing customer
4. **Updates last seen timestamp**
5. **Links conversation** to existing customer

### **Scenario 3: Agent Starts Conversation**
1. **Agent initiates conversation** with phone number
2. **System creates customer** if not exists
3. **Links conversation** to customer
4. **Enables full conversation history**

## 📱 **Frontend Integration**

### **Customer List Component**
```typescript
// Automatically populated with all customers
// Real-time updates when new customers are created
// Filter by channel, date, activity status
```

### **Customer Profile View**
```typescript
// Shows all customer information
// Channel identities list
// Conversation history across all channels
// Customer metadata and analytics
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Customer Not Created**
```bash
# Check logs
grep "Auto-created customer" logs/omnichannel.log

# Verify channel configuration
GET /api/channels

# Check tenant context
grep "tenantId" logs/omnichannel.log
```

#### **Duplicate Customers**
```bash
# Check channel identities
SELECT * FROM customer_identities WHERE customer_id = 'customer_id';

# Verify identity resolution logic
# Check findOrCreateByChannelIdentity method
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=customers npm run start:dev

# Monitor customer creation events
tail -f logs/omnichannel.log | grep "CustomersService"
```

## 📚 **Related Documentation**

- **[Conversation Management](./conversations.md)**
- **[Channel Configuration](./channels.md)**
- **[Message Ingestion](./message-ingestion.md)**
- **[Customer Analytics](./analytics.md)**

## 🎉 **Summary**

The GAQNO Omnichannel system provides **comprehensive automatic customer creation** that ensures:

- ✅ **100% Customer Capture**: Every conversation creates a customer
- ✅ **Multi-Channel Support**: Works across all communication channels
- ✅ **Real-Time Updates**: Immediate customer creation and updates
- ✅ **Rich Metadata**: Automatic profile enrichment and tracking
- ✅ **Analytics Ready**: Built-in customer statistics and insights

**No manual customer entry required - the system handles everything automatically!** 🚀
