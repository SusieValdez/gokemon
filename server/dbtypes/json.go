package dbtypes

import (
	"database/sql/driver"
	"encoding/json"
)

type JSON map[string]interface{}

func (j JSON) Value() (driver.Value, error) {
	valueString, err := json.Marshal(j)
	return valueString, err
}

func (j *JSON) Scan(value interface{}) error {
	if err := json.Unmarshal(value.([]byte), &j); err != nil {
		return err
	}
	return nil
}
