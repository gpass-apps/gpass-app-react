import { FC, useState } from 'react';
import { Col, Input, Row, Select, DatePicker } from 'antd';
import { OptiosSearchValues } from "../table";
import { Dayjs } from "dayjs";

interface Props {
  onSearch: (search: string | Dayjs[], keySearch: string) => void;
  placeholder?: string;
  searchValues: Record<string, string>;
  optiosSearchValues?: OptiosSearchValues[];
}

const { Search } = Input;

const SearchTable: FC<Props> = ({ onSearch, placeholder, searchValues, optiosSearchValues }) => {
  const [keySearch, setKeySearch] = useState<string>(Object.keys(searchValues)[0]);

  return (
    <Row gutter={10}>
      <Col xs={24} md={4}>
        <Select
          style={{ width: '100%' }}
          value={keySearch}
          onChange={(value) => setKeySearch(value)}
        >
          {Object.keys(searchValues).map((key) => (
            <Select.Option key={key} value={key}>
              {searchValues[key]}
            </Select.Option>
          ))}
        </Select>
      </Col>
      <Col md={20}>
        {
          Object.keys(searchValues)?.some(key => key.includes("date") && keySearch.includes("date"))
            ?
            <DatePicker.RangePicker onChange={value => onSearch(value as any, "dateScanned")} />
            :
            optiosSearchValues?.some(option => option.propSearch === keySearch)
              ? <Select style={{ width: '100%' }} onChange={(value) => onSearch(value, keySearch)}>
                {
                  optiosSearchValues.find(optionSearch => optionSearch.propSearch === keySearch)?.options.map(option => (
                    <Select.Option key={option.key} value={option.key}>
                      {option.label}
                    </Select.Option>
                  ))
                }
              </Select>
              : <Search
                enterButton
                onSearch={(value) => onSearch(value, keySearch)}
                placeholder={placeholder}
                style={{ width: '100%' }}
              />
        }

      </Col>
    </Row>
  );
};

export default SearchTable;