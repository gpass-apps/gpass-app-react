import { Modal, UploadFile, message } from "antd";
import { RcFile } from "antd/es/upload";
import { User, onIdTokenChanged, getAuth } from 'firebase/auth';
import { ReactNode } from "react";
import exceljs from "exceljs";

export const statesFromMexico = [
  {
    value: 'Aguascalientes',
    text: 'Aguascalientes'
  },
  {
    value: 'Baja California',
    text: 'Baja California'
  },
  {
    value: 'Baja California Sur',
    text: 'Baja California Sur'
  },
  {
    value: 'Campeche',
    text: 'Campeche'
  },
  {
    value: 'Chiapas',
    text: 'Chiapas'
  },
  {
    value: 'Chihuahua',
    text: 'Chihuahua'
  },
  {
    value: 'Ciudad de México',
    text: 'Ciudad de México'
  },
  {
    value: 'Coahuila',
    text: 'Coahuila'
  },
  {
    value: 'Colima',
    text: 'Colima'
  },
  {
    value: 'Durango',
    text: 'Durango'
  },
  {
    value: 'Estado de México',
    text: 'Estado de México'
  },
  {
    value: 'Guanajuato',
    text: 'Guanajuato'
  },
  {
    value: 'Guerrero',
    text: 'Guerrero'
  },
  {
    value: 'Hidalgo',
    text: 'Hidalgo'
  },
  {
    value: 'Jalisco',
    text: 'Jalisco'
  },
  {
    value: 'Michoacán',
    text: 'Michoacán'
  },
  {
    value: 'Morelos',
    text: 'Morelos'
  },
  {
    value: 'Nayarit',
    text: 'Nayarit'
  },
  {
    value: 'Nuevo León',
    text: 'Nuevo León'
  },
  {
    value: 'Oaxaca',
    text: 'Oaxaca'
  },
  {
    value: 'Puebla',
    text: 'Puebla'
  },
  {
    value: 'Querétaro',
    text: 'Querétaro'
  },
  {
    value: 'Quintana Roo',
    text: 'Quintana Roo'
  },
  {
    value: 'San Luis Potosí',
    text: 'San Luis Potosí'
  },
  {
    value: 'Sinaloa',
    text: 'Sinaloa'
  },
  {
    value: 'Sonora',
    text: 'Sonora'
  },
  {
    value: 'Tabasco',
    text: 'Tabasco'
  },
  {
    value: 'Tamaulipas',
    text: 'Tamaulipas'
  },
  {
    value: 'Tlaxcala',
    text: 'Tlaxcala'
  },
  {
    value: 'Veracruz',
    text: 'Veracruz'
  },
  {
    value: 'Yucatán',
    text: 'Yucatán'
  },
  {
    value: 'Zacatecas',
    text: 'Zacatecas'
  }
];

export const getCurrentToken = () => new Promise<string>((resolve, reject) => {
  const uns = onIdTokenChanged(
    getAuth(),
    async (user: User | null) => {
      uns();

      if (!user) {
        reject("Error de autenticación");
        return;
      }

      const token = await user.getIdToken();
      resolve(token);
    },
    () => reject("Error de autenticación")
  );
});

export const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

export const validFiles = (fileList: RcFile[], accept: string, showMessageError?: boolean) => {
  for (let index = 0; index < fileList.length; index++) {
    const file = fileList[index];
    const types = accept.split(",").map(type => type.trim()) || [];

    if (!types.includes(file.type!)) {
      if (showMessageError) {
        message.error(`Formato incorrecto.`, 4);
      }

      return false;
    }
  }

  return true;
};

export const onPreviewImage = async (file: UploadFile) => {
  let src = file.url as string;

  if (!src) {
    src = await new Promise((resolve) => {
      const reader = new FileReader();

      reader.readAsDataURL(file.originFileObj!);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve("");
    });

    if (!src) {
      message.error(`No se pudo obtener la imagen.`, 4);
      return;
    }
  }

  const image = new Image();
  image.src = src;
  const imgWindow = window.open(src);
  imgWindow?.document.write(image.outerHTML);
};

export const setImagesToState = <T extends { image?: string | UploadFile[], images?: string[] | UploadFile[]; }>(state: T) => {
  const _state = { ...state };

  if (_state.image) {
    const url = _state.image as string;

    const imageUploadFile: UploadFile = {
      name: url,
      uid: url,
      thumbUrl: url,
      url,
      status: "done"
    };

    _state.image = [imageUploadFile];
  }

  if (_state.images?.length) {
    _state.images = _state.images.map(url => {
      url = url as string;

      const imageUploadFile: UploadFile = {
        name: url,
        uid: url,
        thumbUrl: url,
        url,
        status: "done"
      };

      return imageUploadFile;
    });
  }

  return _state;
};

export const fileToBase64 = (file: File) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});

export const handleError = (error: any) => {
  console.log(error);

  if (error instanceof Error) {
    throw new Error(error.message);
  }

  throw new Error(error as string);
};

export const confirmDialog = <T>(content: ReactNode, fun: () => Promise<T>, textSuccess?: string) =>
  new Promise<T>((resolve, reject) => Modal.confirm({
    title: `Espera!`,
    content,
    okText: 'Aceptar',
    cancelText: 'Cancelar',
    onOk: async () => {
      try {
        const res = await fun();

        if (textSuccess) {
          message.success(textSuccess);
        }

        resolve(res);
      } catch (error) {
        console.log(error);
        reject(error);
      }
    },
    onCancel: () => {
      resolve(false as T);
    }
  }));

export const getArrayChunk = <T>(array: Array<T>, size: number) => Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
  array.slice(i * size, i * size + size)
);


export const getWorkbookFromFile = (file: File) => new Promise<exceljs.Workbook>((resolve, reject) => {
  const reader = new FileReader();

  reader.readAsArrayBuffer(file);

  reader.onload = async () => {
    let workbook = new exceljs.Workbook();
    workbook = await workbook.xlsx.load(reader.result as ArrayBuffer);
    resolve(workbook);
  };

  reader.onerror = () => reject(new Error("Error al obtener Workbook."));
});

export const isObject = (value: unknown) => {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
};

export const downloadExcelOneWorkSheet = async (worksheetName: string, columns: Partial<exceljs.Column>[], rows: Record<string, any>[]) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet(worksheetName);
  worksheet.columns = columns;

  worksheet.addRows(rows);

  const data = await workbook.xlsx.writeBuffer();
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');

  a.href = url;
  a.setAttribute("download", `${worksheetName}.xlsx`);
  a.click();
  a.remove();
};


