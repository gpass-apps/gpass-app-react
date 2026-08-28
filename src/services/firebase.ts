import { collection, addDoc, updateDoc, doc, getDoc, query, getDocs, QueryConstraint, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from '../firebaseConfig';
import { getArrayChunk, handleError } from '../utils/functions';
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { UploadFile } from "antd";
import { urlImageDefaultEvent, urlImageDefaultCompany, baseUrlStorage } from "../constants";

const storage = getStorage();
const basesUrlsImagesByCollection: Record<string, string> = {
  "Events": urlImageDefaultEvent,
  "Companies": urlImageDefaultCompany
};

export const add = async <T extends { id?: string; }>(path: string, data: Record<string, any>) => {
  try {
    const _data = { ...data };

    if (_data?.image?.length) {
      const imgUploadFile = _data?.image[0] as UploadFile;

      if (imgUploadFile.url?.includes(baseUrlStorage)) {
        _data.image = imgUploadFile.url;
      } else {
        _data.image = await uploadFile(imgUploadFile.originFileObj!, path);
      }
    } else {
      _data.image = basesUrlsImagesByCollection[path] || "";
    }

    const docRef = await addDoc(collection(db, path), _data);

    return { id: docRef.id, ..._data } as T;
  } catch (error) {
    throw handleError(error);
  }
};

export const update = async <T extends { id?: string; }>(path: string, id: string, data: Record<string, any>) => {
  try {
    if (data?.image?.length) {
      const imgUploadFile = data?.image[0] as UploadFile;

      if (imgUploadFile.url?.includes(baseUrlStorage)) {
        data.image = imgUploadFile.url;
      } else {
        data.image = await uploadFile(imgUploadFile.originFileObj!, path);
      }
    }

    await updateDoc(doc(db, path, id), data);

    return { id, ...data } as T;
  } catch (error) {
    throw handleError(error);
  }
};

export const getDocById = (path: string, id: string) => getDoc(doc(db, path, id));

export const getDocByIdGeneric = async <T extends { id?: string; }>(path: string, id: string) => {
  try {
    const d = await getDoc(doc(db, path, id));

    return { id: d.id, ...d.data() } as T;
  } catch (error) {
    throw handleError(error);
  }
};

export const getGenericDocById = async <T extends { id?: string; }>(path: string, id: string) => {
  try {
    const document = await getDoc(doc(db, path, id));

    return { id, ...document.data() } as T;
  } catch (error) {
    throw handleError(error);
  }
};

export const uploadFile = async (file: File, path: string) => {
  try {
    const completePath = path + "/" + new Date().getTime().toString() + " - " + file.name;
    const storageRef = ref(storage, completePath);

    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  } catch (error) {
    throw handleError(error);
  }
};

export const getCollection = (path: string, _query: QueryConstraint[]) => getDocs(query(collection(db, path), ..._query));

export const getCollectionGeneric = async <T>(path: string, _query: QueryConstraint[]) => {
  try {
    const { docs } = await getDocs(query(collection(db, path), ..._query));

    return docs.map(d => ({
      ...d.data(),
      id: d.id,
    })) as T[];
  } catch (error) {
    throw handleError(error);
  }
};

export const setDocument = async (path: string, id: string, data: Record<string, any>) => {
  await setDoc(doc(db, path, id), data, { merge: true });
};

export const updateDocument = async (path: string, id: string, data: Record<string, any>) => {
  await updateDoc(doc(db, path, id), data);
};

export const createDoc = async (path: string, data: Record<string, any>, id?: string) => {
  if (id) {
    return setDoc(doc(db, path, id), data);
  }

  return addDoc(collection(db, path), data);
};

export const deleteDocument = async (path: string, id: string) => {
  return deleteDoc(doc(db, path, id));
};

export const bulkSetDocuments = async (path: string, documents: Record<string, any>[]) => {
  const documentChunk = getArrayChunk(documents, 500);

  for (const chunk of documentChunk) {
    const batch = writeBatch(db);

    for (const user of chunk) {
      const ref = doc(db, path, user.id);
      batch.set(ref, user, { merge: true });
    }

    await batch.commit();
  }
};
