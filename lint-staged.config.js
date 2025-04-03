export default {
  '*.ts': [
    'eslint --fix',
    () => 'tsc --noEmit'
  ],
};
