import { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import HeaderView from '../../components/headerView';
import Table from '../../components/table';

const Users = () => {
  const columns: ColumnsType<any> = useMemo(() => [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Correo', dataIndex: 'email', key: 'email' },
    { title: 'Teléfono', dataIndex: 'phone', key: 'phone' },
    { title: 'Rol', dataIndex: 'role', key: 'phone' },
    { title: 'Empresa', dataIndex: 'company', key: 'company' },
  ], [])

  return (
    <div style={{ margin: 20 }}>
      <HeaderView
        title="Usuarios"
        path="/usuarios/registrar"
      />
      <Table
        columns={columns}
        placeholderSearch="Buscar por nombre ó correo..."
        pathEdit="/usuarios/editar"
        collection="Users"
        query={[]}
        searchValues={{
          name: "Nombre",
          email: "Correo"
        }}
      />
    </div>
  )
}

export default Users;