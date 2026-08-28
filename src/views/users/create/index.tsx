import { useState, useEffect, useMemo } from 'react';
import DynamicForm from '../../../components/dynamicForm';
import { Card, Form, message, FormRule } from 'antd';
import { initUser, titleForm } from '../../../constants';
import { User, Option, Company } from '../../../interfaces';
import { Rols, TypeRute } from '../../../types';
import HeaderView from "../../../components/headerView";
import { getCollectionGeneric } from '../../../services/firebase';
import { post } from '../../../services/index';
import { where } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import useAbortController from "../../../hooks/useAbortController";
import { statesFromMexico } from "../../../utils/functions";

const roles = [
  {
    value: 'Administrador',
    text: 'Administrador'
  },
  {
    value: 'Embajador',
    text: 'Embajador'
  },
  {
    value: 'Lector',
    text: 'Lector'
  },
  {
    value: 'Empleado',
    text: 'Empleado'
  }
];

const collection = "Users";

const UsersRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const [form] = Form.useForm();
  const [type, setType] = useState<TypeRute>("create");
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User>(initUser);
  const [companies, setCompanies] = useState<Option[]>();
  const abortController = useAbortController();

  const rulesPassword: FormRule[] = useMemo(() => [
    { required: !user.id && user.password !== "", min: 6, message: 'La contraseña tiene que ser de 6 dígitos o más.' },
  ], [user.password, user.id]);

  useEffect(() => {
    let _user = { ...state } as User | null;

    setType(_user?.id ? "update" : "create");

    if (!_user?.id) return;

    form.setFieldsValue(_user);
    setUser(_user);
  }, [state, form]);

  const dataCompanies = async () => {
    const response = await getCollectionGeneric<Company>('Companies', [where("disabled", "==", false)]);
    if (!response) return;

    const selectComapanies = response.map((company) => {
      return {
        value: company.name + "-" + company.id,
        text: company.name
      };
    });

    setCompanies(selectComapanies as Option[]);
  };

  useEffect(() => {
    dataCompanies();
  }, []);

  const onFinish = async () => {
    if (saving) return;

    setSaving(true);

    const duplicateData = await getCollectionGeneric<User>(collection, [where("email", "==", user.email)]);

    if (duplicateData.length && (!user.id || (user.id && user.id !== duplicateData[0].id))) {
      message.error('Este usuario ya esta registrado.', 4);
      setSaving(false);
      return;
    }
    let _user = { ...user };
    const { password, confirmPassword } = _user;

    if (confirmPassword !== password) {
      message.error('Las contraseñas no coinciden.');
      setSaving(false);
      return;
    }

    delete _user.confirmPassword;
    _user.email = _user.email.toLocaleLowerCase();

    try {
      if (type === "update") {
        await post(`/users/${type}`, _user, abortController.current!);
      } else {
        await post(`/users/${type}`, _user, abortController.current!);
      }
      message.success('Usuario guardado con éxito.', 4);
      navigate('/usuarios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <HeaderView
        title={titleForm[type]}
        path="/usuarios"
        goBack
      />
      <Card>
        <DynamicForm
          form={form}
          layout='vertical'
          loading={saving}
          onFinish={onFinish}
          justify="center"
          inputs={[
            {
              typeControl: 'input',
              typeInput: 'text',
              label: 'Nombre',
              name: 'name',
              rules: [{ required: true, message: 'Favor de escribir el nombre del usuario.' }],
              value: user.name,
              onChange: (value: string) => setUser({ ...user, name: value }),
              md: 8
            },
            {
              typeControl: 'input',
              typeInput: 'email',
              label: 'Correo',
              disabled: type === "update" ? false : true,
              name: 'email',
              value: user.email,
              onChange: (value: string) => setUser({ ...user, email: value }),
              md: 8
            },
            {
              typeControl: 'phone',
              label: 'Teléfono',
              name: 'phone',
              value: user.phone,
              onChange: (value: string) => setUser({ ...user, phone: value }),
              md: 8
            },
            {
              typeControl: 'select',
              label: 'Empresa',
              name: 'companyName',
              value: user.companyName + "-" + user.companyUid,
              onChange: (value: string) => setUser({ ...user, companyName: value.split("-")[0], companyUid: value.split("-")[1] }),
              md: 6,
              options: companies
            },
            {
              typeControl: 'select',
              label: 'Rol',
              name: 'role',
              value: user.role,
              onChange: (value: Rols) => setUser({ ...user, role: value }),
              md: 6,
              options: roles as Option[]
            },
            {
              md: 6,
              typeControl: "input",
              typeInput: "password",
              label: "Contraseña",
              name: "password",
              value: user.password,
              onChange: (value: Rols) => setUser({ ...user, password: value }),
              rules: rulesPassword,
            },
            {
              md: 6,
              typeControl: "input",
              typeInput: "password",
              label: "Confirmar contraseña",
              name: "confirmPassword",
              value: user.confirmPassword,
              onChange: (value: Rols) => setUser({ ...user, confirmPassword: value }),
              rules: rulesPassword,
            },
            {
              typeControl: 'input',
              typeInput: 'number',
              label: 'Zona',
              name: 'zone',
              disabled: type === "update",
              value: user.zone,
              onChange: (value: string) => setUser(e => ({ ...user, zone: value ? value : undefined })),
              md: 12
            },
            {
              typeControl: 'select',
              label: 'Estado',
              name: 'state',
              value: user.state,
              onChange: (value: Rols) => setUser({ ...user, state: value }),
              md: 12,
              options: statesFromMexico as Option[]
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default UsersRegister;