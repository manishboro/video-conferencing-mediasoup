import { Link } from "react-router-dom";

import { Box } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const GetIcon = ({ Icon, iconStyles }) => {
  return (
    <>
      {Icon && typeof Icon === "object" && (
        <Icon sx={{ fontSize: "25px", marginLeft: "1rem", ...iconStyles }} />
      )}
      {Icon && typeof Icon === "function" && Icon()}
    </>
  );
};

const CustomButton = ({
  text,
  href,
  variant = "contained",
  color = "primary",
  type = "button",
  Icon,
  enableIcon = true,
  IconDirection = "right",
  loading = false,
  fn = () => null,
  rootStyles,
  buttonStyles,
  iconStyles,
}) => {
  const ButtonContent = () => (
    <Box
      sx={{
        height: "45px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 1.5rem",
        ...buttonStyles,
      }}
    >
      {IconDirection === "right" && (
        <Box style={{ display: "flex", alignItems: "center" }}>
          {text}{" "}
          <span style={{ display: "flex", alignItems: "center" }}>
            {Icon && enableIcon ? (
              <GetIcon Icon={Icon} iconStyles={iconStyles} />
            ) : (
              <NavigateNextIcon sx={{ fontSize: "25px", marginLeft: "1rem" }} />
            )}
          </span>
        </Box>
      )}

      {IconDirection === "left" && (
        <Box style={{ display: "flex", alignItems: "center" }}>
          {Icon && enableIcon ? (
            <GetIcon
              Icon={Icon}
              iconStyles={{ margin: "0 1rem 0 0", ...iconStyles }}
            />
          ) : (
            <NavigateNextIcon sx={{ fontSize: "25px", marginLeft: "1rem" }} />
          )}{" "}
          {text}
        </Box>
      )}
    </Box>
  );

  return (
    <Button
      variant={variant}
      color={color}
      type={type}
      onClick={() => (fn ? fn() : null)}
      disabled={loading}
      sx={{
        borderRadius: "3rem",
        fontSize: "16px",
        fontFamily: "Montserrat",
        position: "relative",
        width: "max-content",
        padding: 0,
        height: "max-content",
        textTransform: "none",
        outline: "none",
        ...rootStyles,

        "& a": {
          color: "white",
          textDecoration: "none",
        },
      }}
    >
      {!loading ? (
        href ? (
          <Link to={href}>
            <ButtonContent />
          </Link>
        ) : (
          <ButtonContent />
        )
      ) : (
        <Box
          sx={{
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "0 1.5rem",
            ...buttonStyles,
          }}
        >
          <CircularProgress
            color="secondary"
            style={{ height: "30px", width: "30px", margin: "auto" }}
          />
        </Box>
      )}
    </Button>
  );
};

export default CustomButton;
