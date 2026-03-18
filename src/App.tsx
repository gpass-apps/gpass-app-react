import MyRouter from './router';
import { AuthProvider } from './context/authContext';
import 'dayjs/locale/es';
import locale from 'antd/locale/es_ES';
import { ConfigProvider } from 'antd';
import { App as AntdApp } from "antd";

const App = () => {
  return (
    <AntdApp >
      <ConfigProvider locale={locale}>
        <AuthProvider>
          <MyRouter />
        </AuthProvider>
      </ConfigProvider>
    </AntdApp>
  );
};

export default App;
