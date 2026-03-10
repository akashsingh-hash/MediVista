const axios = require('axios');

async function test() {
    try {
        const loginRes = await axios.post('http://localhost:7777/api/auth/login', { username: 'admin', password: 'password' });
        const cookie = loginRes.headers['set-cookie'][0];

        const res = await axios.post('http://localhost:7777/api/records', {
            patientName: 'Test', emrSystem: 'Practo_EMR', billingSystem: 'Oracle_Health', departmentType: 'Cardiology', medicineCost: 15000.0, procedureCost: 120000.0, roomCharges: 25000.0, expectedInsurancePayment: 140000.0, patientPayableAmount: 20000.0, age: 45, sex: 'M', insuranceProvider: 'Star_Health', insuranceType: 'Private',
            isApproved: true,
            approvalConfidence: 0.9,
            denialRisk: 0.1,
            predictedDenialReason: null,
            actionRequired: 'Claim looks solid',
            nextBestActionInstruction: 'Verify',
            nextBestActionDepartment: 'Compliance',
            estimatedDaysToPay: 15,
            expectedDate: '2026-03-25',
            financialAlertLevel: 'High'
        }, { headers: { Cookie: cookie } });

        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();
