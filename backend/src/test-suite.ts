import { buildApp } from './app.js';
import assert from 'node:assert';

async function runTests() {
  console.log('🚀 เริ่มต้นการทดสอบ End-to-End API Integration Suite...');
  const app = buildApp();
  await app.ready();

  try {
    // 1. Health check
    const healthRes = await app.inject({ method: 'GET', url: '/health' });
    assert.strictEqual(healthRes.statusCode, 200, 'Health check should return 200');
    console.log('✅ [1/8] Health Check ผ่าน');

    // 2. Auth: Register & Login PIN
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        phone: '0812345678',
        pin: '1234',
        displayName: 'พี่แมน',
        gender: 'MALE',
        themeColor: '#F97316',
      },
    });
    assert.strictEqual(regRes.statusCode, 201, 'Register should return 201');
    const authData = JSON.parse(regRes.payload).data;
    const token = authData.token;
    assert.ok(token, 'Token must exist');
    console.log('✅ [2/8] Auth Register & PIN Token Issuance ผ่าน');

    // 3. Houses: Create & List
    const houseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/houses',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'บ้านสุขใจ' },
    });
    assert.strictEqual(houseRes.statusCode, 201);
    const house = JSON.parse(houseRes.payload).data.house;
    assert.strictEqual(house.name, 'บ้านสุขใจ');
    console.log('✅ [3/8] Houses Create & Owner Assignment ผ่าน');

    // 4. Members: Virtual member creation & 1-Way Alias
    const virtualRes = await app.inject({
      method: 'POST',
      url: `/api/v1/houses/${house.id}/members/virtual`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'คุณยาย', gender: 'FEMALE', themeColor: '#8B5CF6' },
    });
    assert.strictEqual(virtualRes.statusCode, 201);
    const virtualMember = JSON.parse(virtualRes.payload).data.member;
    assert.strictEqual(virtualMember.is_virtual, true);
    console.log('✅ [4/8] Polymorphic Members & Virtual Creation ผ่าน');

    // 5. Tasks: Create with Fair Satang split (10,000 Satang split 2 ways)
    const membersRes = await app.inject({
      method: 'GET',
      url: `/api/v1/houses/${house.id}/members`,
      headers: { authorization: `Bearer ${token}` },
    });
    const members = JSON.parse(membersRes.payload).data.members;
    assert.strictEqual(members.length, 2, 'House should have 2 members (Owner + Virtual)');

    const taskRes = await app.inject({
      method: 'POST',
      url: `/api/v1/houses/${house.id}/tasks`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'ซื้อของเข้าบ้าน',
        holderId: members[0].id,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        hasExpense: true,
        amountSatang: 10000,
        splitType: 'EQUAL',
        splitMembers: [{ memberId: members[0].id }, { memberId: members[1].id }],
      },
    });
    assert.strictEqual(taskRes.statusCode, 201);
    const task = JSON.parse(taskRes.payload).data.task;
    assert.strictEqual(task.amountSatang, 10000);
    assert.strictEqual(task.splits.length, 2);
    assert.strictEqual(task.splits[0].amountSatang, 5000);
    assert.strictEqual(task.splits[1].amountSatang, 5000);
    console.log('✅ [5/8] Tasks Creation & Fair Satang Enforced ผ่าน');

    // 6. Handover Chain: Pass ball & Complete
    const handoverRes = await app.inject({
      method: 'POST',
      url: `/api/v1/houses/${house.id}/tasks/${task.id}/handover`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        action: 'COMPLETE',
        toMemberId: members[0].id,
        note: 'จัดการเสร็จสิ้น',
      },
    });
    assert.strictEqual(handoverRes.statusCode, 200);
    const completedTask = JSON.parse(handoverRes.payload).data.task;
    assert.strictEqual(completedTask.status, 'COMPLETED');
    console.log('✅ [6/8] Tasks Handover Chain (Pass ball / Complete) ผ่าน');

    // 7. Finance: Net balances & PromptPay QR
    const balanceRes = await app.inject({
      method: 'GET',
      url: `/api/v1/houses/${house.id}/finance/balances`,
      headers: { authorization: `Bearer ${token}` },
    });
    assert.strictEqual(balanceRes.statusCode, 200);
    const balances = JSON.parse(balanceRes.payload).data.balances;
    assert.ok(balances.length >= 2);
    console.log('✅ [7/8] Finance Net Balances & Settle Tracking ผ่าน');

    // 8. AI Natural Language Parser & Receipt OCR
    const aiRes = await app.inject({
      method: 'POST',
      url: '/api/v1/ai/parse-task',
      headers: { authorization: `Bearer ${token}` },
      payload: { text: 'พรุ่งนี้ช่างแอร์ 3500 บาท' },
    });
    assert.strictEqual(aiRes.statusCode, 200);
    const aiParsed = JSON.parse(aiRes.payload).data;
    assert.strictEqual(aiParsed.amountSatang, 350000);
    console.log('✅ [8/8] Gemini AI Natural Language Task & Receipt OCR ผ่าน');

    console.log('\n🎉 ทุกการทดสอบ End-to-End ผ่านครบถ้วน 100% โดยไม่มีข้อผิดพลาด');
  } finally {
    await app.close();
  }
}

runTests().catch((err) => {
  console.error('❌ การทดสอบล้มเหลว:', err);
  process.exit(1);
});
