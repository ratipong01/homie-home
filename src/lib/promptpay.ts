function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(targetPhone: string, amountBaht?: number): string {
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const mobileFormatted = cleanPhone.startsWith('0') ? '0066' + cleanPhone.slice(1) : cleanPhone;

  const aid = emvField('00', 'A000000677010111');
  const recipient = emvField('01', mobileFormatted);
  const merchantInfo = emvField('29', `${aid}${recipient}`);

  let payload = `${emvField('00', '01')}${emvField('01', amountBaht ? '12' : '11')}${merchantInfo}${emvField('53', '764')}`;

  if (amountBaht && amountBaht > 0) {
    payload += emvField('54', amountBaht.toFixed(2));
  }

  payload += `${emvField('58', 'TH')}${emvField('63', '04')}`;
  const crc = crc16(payload);
  return `${payload.slice(0, -4)}${emvField('63', crc)}`;
}
